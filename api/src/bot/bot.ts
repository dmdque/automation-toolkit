import { ZeroEx } from '0x.js';
import { Aqueduct, LimitOrder } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import * as ws from 'ws';
import { tokenPairCache } from '../cache/token-pair-cache';
import { OrderRepository } from '../db/order-repository';
import { OrderService } from '../services/order-service';
import { TickerService } from '../services/ticker-service';
import { TokenService } from '../services/token-service';

(global as any).WebSocket = ws;

export interface IBotParams {
  account: string;
  baseSymbol: string;
  expirationSeconds: number;
  networkId: number;
  quoteSymbol: string;
  spreadMinPercent: number;
  spreadMaxPercent: number;
  layers: number;
  baseReserve: number;
  quoteReserve: number;
}

interface IPriceSegment {
  price: BigNumber;
  amount: BigNumber;
}

interface IPriceSegmentParams {
  price: BigNumber;
  side: 'buy' | 'sell';
  layers: number;
  reserveAmount: BigNumber;
  balance: BigNumber;
  tokenPair: Aqueduct.Api.ITokenPair;
}

export class Bot {
  private readonly orderRepo = new OrderRepository();
  private readonly orderService = new OrderService();
  private isCreatingOrderBook = false;

  constructor(private readonly params: IBotParams) {
    const apiKeyId = process.env['AQUEDUCT_API_KEY_ID'];
    if (!apiKeyId) {
      throw new Error(`api key id required`);
    }

    if (params.quoteSymbol.toUpperCase() !== 'WETH') {
      throw new Error(`bot currently only supports WETH as quote token`);
    }

    Aqueduct.Initialize({ apiKeyId });
  }

  public async start() {
    const baseToken = await tokenPairCache.getTokenBySymbol({
      networkId: this.params.networkId,
      symbol: this.params.baseSymbol
    });

    const tickerService = new TickerService();

    const respondToPrice = async () => {
      const price = await tickerService.getPrice(baseToken);
      this.createOrdersAtPriceLevel(price);
    };

    await respondToPrice();
    tickerService.onChange(() => {
      console.info('rebalancing after price change...');
      respondToPrice();
    });

    this.orderService.onChange(this.params.account, data => this.processOrderChange(data));
  }

  private async createOrdersAtPriceLevel(price: BigNumber) {
    if (this.isCreatingOrderBook) { return; }
    this.isCreatingOrderBook = true;

    try {
      const {
        networkId, baseSymbol, quoteSymbol, expirationSeconds,
        layers, account, baseReserve, quoteReserve
      } = this.params;
      const tokenPair = await tokenPairCache.getTokenPair({ networkId, baseSymbol, quoteSymbol });
      const baseToken = await tokenPairCache.getTokenBySymbol({ networkId, symbol: baseSymbol });
      const quoteToken = await tokenPairCache.getTokenBySymbol({ networkId, symbol: quoteSymbol });
      const tokenService = new TokenService('http://localhost:8545', networkId);
      const expirationDate = moment().add(expirationSeconds, 'seconds').toDate();
      const balanceOp = (t: Aqueduct.Api.IToken) => tokenService.getTokenBalance({ account, tokenAddress: t.address });
      const baseReserveInBaseUnits = ZeroEx.toBaseUnitAmount(new BigNumber(baseReserve), baseToken.decimals);
      const quoteReserveInBaseUnits = ZeroEx.toBaseUnitAmount(new BigNumber(quoteReserve), quoteToken.decimals);

      await this.syncOrders(tokenPair);

      // buy side
      const buySegments = await this.getPriceSegments({
        price,
        side: 'buy',
        layers,
        balance: await balanceOp(baseToken),
        reserveAmount: baseReserveInBaseUnits,
        tokenPair
      });

      for (let i = 0; i < buySegments.length; i++) {
        const segment = buySegments[i];
        const order = await new LimitOrder({
          account: this.params.account,
          baseTokenSymbol: baseToken.symbol,
          quoteTokenSymbol: quoteToken.symbol,
          nodeUrl: 'http://localhost:8545',
          price: segment.price,
          expirationDate,
          type: 'buy',
          quantityInWei: segment.amount
        }).execute();
        await this.orderRepo.create(order);
      }

      const sellSegments = await this.getPriceSegments({
        price,
        side: 'sell',
        layers,
        balance: await balanceOp(quoteToken),
        reserveAmount: quoteReserveInBaseUnits,
        tokenPair
      });

      for (let i = 0; i < sellSegments.length; i++) {
        const segment = sellSegments[i];
        const order = await new LimitOrder({
          account: this.params.account,
          baseTokenSymbol: baseToken.symbol,
          quoteTokenSymbol: quoteToken.symbol,
          nodeUrl: 'http://localhost:8545',
          price: segment.price,
          expirationDate,
          type: 'sell',
          quantityInWei: segment.amount
        }).execute();
        await this.orderRepo.create(order);
      }

      this.isCreatingOrderBook = false;
    } catch (err) {
      this.isCreatingOrderBook = false;
      throw err;
    }
  }

  private async getPriceSegments(params: IPriceSegmentParams) {
    const { price, side, layers, balance, reserveAmount, tokenPair } = params;

    // market price is 100, percentage spread is 5%, spread diff should be "5" to get to 95
    const spreadMinDiff = price.times(this.params.spreadMinPercent / 100);
    const spreadMaxDiff = price.times(this.params.spreadMaxPercent / 100);
    const interval = spreadMinDiff.minus(spreadMaxDiff).abs().dividedBy(layers);

    const segmentAmount = reserveAmount.dividedBy(layers);
    if (segmentAmount.lessThan(tokenPair.minimumQuantity)) {
      throw new Error(`
        amounts for layered orders too low\n
        provided ${segmentAmount.toString()}
        minimum  ${tokenPair.minimumQuantity}
      `);
    }

    let remainingBalance = balance;

    const priceSegments: Array<IPriceSegment> = [];
    for (let i = 0; i < layers; i++) {
      // TODO: See if there's an order open that approximately represents this segment
      const segmentPrice = side === 'buy'
        ? price.sub(spreadMinDiff).sub(interval.times(i))
        : price.add(spreadMinDiff).add(interval.times(i));

      let amount = segmentAmount;
      if (amount.greaterThan(remainingBalance)) {
        amount = remainingBalance;
      }

      if (remainingBalance.lessThan(tokenPair.minimumQuantity)) {
        console.log(`
          remaining balance (${remainingBalance.toString()}) less than minimum quantity (${tokenPair.minimumQuantity})
        `);
        break;
      }

      priceSegments.push({
        price: segmentPrice,
        amount
      });
      remainingBalance = remainingBalance.minus(amount);
    }

    return priceSegments;
  }

  /**
   * Find locally stored orders, remote orders, and reconcile the differences
   */
  private async syncOrders(tokenPair: Aqueduct.Api.ITokenPair) {
    const buyParams = { makerTokenAddress: tokenPair.tokenB.address, takerTokenAddress: tokenPair.tokenA.address };
    const localBuyOrders = this.orderArrayToMap(await this.removeExpiredOrders(await this.orderRepo.find(buyParams)));
    const remoteBuyOrders = this.orderArrayToMap(await new Aqueduct.Api.OrdersService().get({
      networkId: this.params.networkId,
      maker: this.params.account,
      isOpen: true,
      ...buyParams
    }));

    const buys = new Array<Aqueduct.Api.Order>();
    for (const key in localBuyOrders) {
      const order = localBuyOrders[key];
      if (!remoteBuyOrders[order.id]) {
        console.info(`cached order ${order.id} not presently remotely - removing`);
        await this.orderRepo.delete({ id: order.id });
      } else {
        buys.push(order);
      }
    }

    const sellParams = { makerTokenAddress: tokenPair.tokenA.address, takerTokenAddress: tokenPair.tokenB.address };
    const localSellOrders = this.orderArrayToMap(await this.removeExpiredOrders(await this.orderRepo.find(sellParams)));
    const remoteSellOrders = this.orderArrayToMap(await new Aqueduct.Api.OrdersService().get({
      networkId: this.params.networkId,
      maker: this.params.account,
      isOpen: true,
      ...sellParams
    }));

    const sells = new Array<Aqueduct.Api.Order>();
    for (const key in localSellOrders) {
      const order = localSellOrders[key];
      if (!remoteSellOrders[order.id]) {
        console.info(`cached order ${order.id} not presently remotely - removing`);
        await this.orderRepo.delete({ id: order.id });
      } else {
        sells.push(order);
      }
    }

    return { buys, sells };
  }

  private async removeExpiredOrders(orders: Aqueduct.Api.Order[]) {
    const filteredOrders = new Array<Aqueduct.Api.Order>();

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (order.expirationUnixTimestampSec <= new Date().getTime() / 1000) {
        await this.orderRepo.delete({ id: order.id });
        console.info(`order ${order.id} expired; removing`);
        continue;
      }

      filteredOrders.push(order);
    }

    return filteredOrders;
  }

  private async processOrderChange(data: Aqueduct.Events.IOrderChangeEventData) {
    const tokenPair = await tokenPairCache.getTokenPair(this.params);
    if (!(
      (data.order.makerTokenAddress === tokenPair.tokenA.address || data.order.takerTokenAddress === tokenPair.tokenA.address) &&
      (data.order.makerTokenAddress === tokenPair.tokenB.address || data.order.takerTokenAddress === tokenPair.tokenB.address)
    )) {
      return;
    }

    // "canceled" | "created" | "expired" | "filled" | "partially-filled" | "pending-cancellation" | "pending-filled" | "pending-partially-filled" | "removed"
    if (['canceled', 'expired', 'filled', 'removed'].indexOf(data.eventType) !== -1) {
      await this.orderRepo.delete({ id: data.order.id });
      console.info('rebalancing after order removed...');
      const price = await new TickerService().getPrice(tokenPair.tokenA);
      this.createOrdersAtPriceLevel(price);
      return;
    }
  }

  private orderArrayToMap(orders: Aqueduct.Api.Order[]) {
    const map: { [orderId: number]: Aqueduct.Api.Order } = {};
    orders.forEach(o => map[o.id] = o);
    return map;
  }
}
