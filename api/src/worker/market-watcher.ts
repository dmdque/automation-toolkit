import { BigNumber } from 'bignumber.js';
import { tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { bandRepository } from '../db/band-repository';
import { IStoredMarket, marketRepository } from '../db/market-repository';
import { orderRepository, State } from '../db/order-repository';
import { BandService } from '../services/band-service';
import { LogService } from '../services/log-service';
import { MarketService } from '../services/market-service';
import { OrderService } from '../services/order-service';
import { toUnitAmount } from '../utils/conversion';
import { getOrderSide } from '../utils/order-utils';

export class MarketWatcher {
  private readonly logService = new LogService();
  private readonly bandService = new BandService();
  private readonly orderService = new OrderService();

  public async start() {
    await this.stopAllMarkets();

    const markets = await marketRepository.find({});
    for (let market of markets) {
      this.startMarket(market);
    }
  }

  public async cycle(market: IStoredMarket) {
    const canCycle = await this.canCycle(market);
    if (!canCycle) {
      market.active = false;
      await marketRepository.update({ _id: market._id }, market);
      return;
    }

    const bands = await bandRepository.find({ marketId: market._id });
    for (let band of bands) {
      this.bandService.start(band);
    }
  }

  public async addMarket(market: IStoredMarket) {
    this.startMarket(market);
  }

  private async startMarket(market: IStoredMarket) {
    let isProcessing = false;
    setInterval(async () => {
      if (isProcessing) { return; }

      isProcessing = true;
      await this.cycle(market);
      isProcessing = false;
    }, 10000);
  }

  private async stopAllMarkets() {
    const markets = await marketRepository.find({ active: true });
    for (let market of markets) {
      market.active = false;
      await marketRepository.update({ _id: market._id }, market);
    }
  }

  private async canCycle(market: IStoredMarket) {
    const tokenPair = await this.getTokenPair(market);
    const stats = await new MarketService().generateStats(market._id);
    const orders = await orderRepository.find({ marketId: market._id, state: State.Open });

    const belowEthReserve = new BigNumber(stats.ethBalance).lessThan(market.minEthAmount);
    if (belowEthReserve) {
      const toUnit = (value: string) => toUnitAmount({ token: { decimals: 18 }, value });
      if (orders.length) {
        this.logService.addMarketLog({
          severity: 'critical',
          marketId: market._id,
          message: `below minimum ether amount: ${toUnit(stats.ethBalance)}/${toUnit(market.minEthAmount)}; all orders will be canceled`
        });
      }

      for (let order of orders) {
        const validatedOrder = await this.orderService.getValidatedOrder(order);
        if (validatedOrder) {
          await this.orderService.cancelOrder(validatedOrder);
        }
      }

      return false;
    }

    const belowBaseReserve = new BigNumber(stats.baseBalance).lessThan(market.minBaseAmount);
    if (belowBaseReserve) {
      const toUnit = (value: string) => toUnitAmount({ token: tokenPair.tokenA, value });
      let sellOrders = orders.filter(o => getOrderSide({ order: o, tokenPair }) === 'sell');
      if (sellOrders.length) {
        this.logService.addMarketLog({
          severity: 'critical',
          marketId: market._id,
          message: `below minimum ${market.baseTokenSymbol} amount: ${toUnit(stats.baseBalance)}/${toUnit(market.minBaseAmount)}; sell orders will be canceled`
        });
      }

      for (let sellOrder of sellOrders) {
        const validatedOrder = await this.orderService.getValidatedOrder(sellOrder);
        if (validatedOrder) {
          await this.orderService.cancelOrder(validatedOrder);
        }
      }
    }

    const belowQuoteReserve = new BigNumber(stats.quoteBalance).lessThan(market.minQuoteAmount);
    if (belowQuoteReserve) {
      const toUnit = (value: string) => toUnitAmount({ token: tokenPair.tokenA, value });
      let buyOrders = orders.filter(o => getOrderSide({ order: o, tokenPair }) === 'buy');
      if (buyOrders.length) {
        this.logService.addMarketLog({
          severity: 'critical',
          marketId: market._id,
          message: `below minimum ${market.quoteTokenSymbol} amount: ${toUnit(stats.quoteBalance)}/${toUnit(market.minQuoteAmount)}; buy orders will be canceled`
        });
      }

      for (let buyOrder of buyOrders) {
        const validatedOrder = await this.orderService.getValidatedOrder(buyOrder);
        if (validatedOrder) {
          await this.orderService.cancelOrder(validatedOrder);
        }
      }
    }

    return !(belowBaseReserve && belowQuoteReserve);
  }

  private async getTokenPair(market: IStoredMarket) {
    const { baseTokenSymbol, quoteTokenSymbol } = market;
    return await tokenPairCache.getTokenPair({
      baseSymbol: baseTokenSymbol,
      quoteSymbol: quoteTokenSymbol,
      networkId: config.networkId
    });
  }
}

export const marketWatcher = new MarketWatcher();
