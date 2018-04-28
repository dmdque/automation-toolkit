import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { ITokenPairCache, tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { bandRepository, IBandRepository, IStoredBand } from '../db/band-repository';
import { IMarketRepository, IStoredMarket, marketRepository } from '../db/market-repository';
import { IOrder, IOrderRepository, IStoredOrder, orderRepository } from '../db/order-repository';
import { ServerError } from '../errors/server-error';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { getAbsoluteSpread } from '../utils/conversion';
import { getOrderPrice } from '../utils/order-utils';
import { ILogService, LogService } from './log-service';
import { PriceFeed } from './price-feed';

export interface IGetLimitOrderQuantityParams {
  side: 'buy' | 'sell';
  tokenPair: Aqueduct.Api.ITokenPair;
  market: IStoredMarket;
}

export interface IValidateRemoveResult {
  hasActiveOrders: boolean;
}

export interface IRemoveBandRequest {
  bandId: string;
  immediateCancelation: boolean;
}

export interface IBandServiceParams {
  logService?: ILogService;
  marketRepo?: IMarketRepository;
  tpCache?: ITokenPairCache;
  priceFeed?: PriceFeed;
  orderRepo?: IOrderRepository;
  aqueductOrdersService?: Aqueduct.Api.IOrdersService;
  bandRepo?: IBandRepository;
  tradingService?: AqueductRemote.Api.ITradingService;
  walletService?: AqueductRemote.Api.IWalletService;
}

export class BandService {
  private readonly marketRepo: IMarketRepository;
  private readonly tpCache: ITokenPairCache;
  private readonly priceFeed: PriceFeed;
  private readonly orderRepo: IOrderRepository;
  private readonly aqueductOrdersService: Aqueduct.Api.IOrdersService;
  private readonly bandRepo: IBandRepository;
  private readonly tradingService: AqueductRemote.Api.ITradingService;
  private readonly walletService: AqueductRemote.Api.IWalletService;
  private readonly logService: ILogService;

  constructor(params: IBandServiceParams = {}) {
    this.logService = params.logService || new LogService();
    this.marketRepo = params.marketRepo || marketRepository;
    this.tpCache = params.tpCache || tokenPairCache;
    this.priceFeed = params.priceFeed || config.priceFeed;
    this.orderRepo = params.orderRepo || orderRepository;
    this.aqueductOrdersService = params.aqueductOrdersService || new Aqueduct.Api.OrdersService();
    this.bandRepo = params.bandRepo || bandRepository;
    this.tradingService = params.tradingService || new AqueductRemote.Api.TradingService();
    this.walletService = params.walletService || new AqueductRemote.Api.WalletService();
  }

  public async start(band: IStoredBand) {
    const market = await this.marketRepo.findOne({ _id: band.marketId });
    if (!market) {
      throw new ServerError(`market ${band.marketId} doesn't exist`, 404);
    }

    const { account, baseTokenSymbol, quoteTokenSymbol } = market;
    const tokenPair = await this.tpCache.getTokenPair({
      baseSymbol: baseTokenSymbol,
      quoteSymbol: quoteTokenSymbol,
      networkId: config.networkId
    });

    let price: BigNumber;
    try {
      price = await this.priceFeed.getPrice(baseTokenSymbol, quoteTokenSymbol);
    } catch (err) {
      this.logService.addBandLog({ bandId: band._id, severity: 'critical', message: err.message });
      console.error(err.message);
      return;
    }

    const absoluteSpread = getAbsoluteSpread({ price, spreadBps: band.spreadBps });
    const validBandOrders = new Array<IOrder>();

    // are there already bound orders?
    let existingOrders = await this.orderRepo.find({ bandId: band._id, bound: true });
    if (existingOrders && existingOrders.length > 0) {
      // market got turned off, clean up any orders that are still showing as bound
      if (!market.active) {
        for (let i = 0; i < existingOrders.length; i++) {
          const order = existingOrders[i];
          order.bound = false;
          await this.orderRepo.update({ _id: order._id }, order);
        }
        return;
      }

      for (let i = 0; i < existingOrders.length; i++) {
        let order = existingOrders[i];
        const validatedOrder = await this.getValidatedOrder(order);
        if (validatedOrder) {
          order = validatedOrder;
        } else {
          continue;
        }

        // see if it's outside price tolerance
        const status = await this.bandContainmentStatus({
          price, order, band, baseDecimals: tokenPair.tokenA.decimals
        });
        if (status !== 'contained') {
          // see if we can find a band that it fits in
          const otherBands = (await this.bandRepo.find({
            side: band.side,
            marketId: market._id
          }, {
              sort: {
                key: 'spreadBps',
                direction: band.side === 'buy' ? 'desc' : 'asc'
              }
            }))
            .filter(b => b._id !== band._id);

          let movedOrder = false;
          for (let j = 0; j < otherBands.length; j++) {
            const b = otherBands[j];

            const inBand = (await this.bandContainmentStatus({
              price, order, band: b, baseDecimals: tokenPair.tokenA.decimals
            })) === 'contained';
            if (inBand) {
              order.bandId = b._id;
              await this.orderRepo.update({ _id: order._id }, order);
              movedOrder = true;

              await this.logService.addBandLog({
                bandId: band._id,
                message: `moving order ${order._id} into adjacent band`,
                severity: 'info'
              });
              break;
            }
          }

          // couldn't find a band to put it into
          if (!movedOrder) {
            if (status === 'loss-risk') {
              try {
                const txHash = await this.tradingService.cancelOrder({ orderHash: order.orderHash });
                await this.logService.addBandLog({
                  severity: 'info',
                  bandId: band._id,
                  message: `band ${band._id} canceled order due to price changes ${order.id} w/ tx ${txHash}`
                });

                order.valid = false;
                order.bound = false;
                await this.orderRepo.update({ _id: order._id }, order);
              } catch (err) {
                await this.logService.addBandLog({
                  severity: 'critical',
                  bandId: band._id,
                  message: `band ${band._id} failed to cancel order due to price changes ${order.id}: ${err.message}`
                });
                return;
              }
            } else {
              // it's not going to lose us money (right now) but we should keep an eye on it
              order.bound = false;
              order.bandId = undefined;
              order.valid = true;
              await this.orderRepo.update({ _id: order._id }, order);
            }
          }
        } else {
          // the price is fine
          validBandOrders.push(order);
        }
      }
    }

    if (!market.active) {
      return;
    }

    // let's see if there are orders that actually fit the bill here
    const orphanedOrders = await this.orderRepo.find({ marketId: market._id, valid: true, bound: false });
    for (let o of orphanedOrders) {
      const order = await this.getValidatedOrder(o);
      if (!order) { continue; }

      const status = await this.bandContainmentStatus({
        price, order, band, baseDecimals: tokenPair.tokenA.decimals
      });
      if (status === 'contained') {
        // great, update it
        order.bandId = band._id;
        order.bound = true;
        await this.orderRepo.update({ _id: order._id}, order);
        validBandOrders.push(order);
      }
    }

    const allBands = await this.bandRepo.find({ marketId: market._id, side: band.side });
    const totalUnitsQuantity = allBands.map(b => b.units).reduce((a, b) => a + b);

    let availableTokenBalance: BigNumber;
    try {
      availableTokenBalance = await this.getAvailableBalance({
        side: band.side as 'buy' | 'sell',
        tokenPair,
        market
      });
    } catch (err) {
      console.error(`failed to get balance for band id ${band._id}`);
      this.logService.addBandLog({ bandId: band._id, message: err.message, severity: 'critical' });
      return;
    }

    let remainingQuantity = new BigNumber(0);
    if (validBandOrders.length > 0) {
      validBandOrders.forEach(o => {
        const remainingTakerAmount = new BigNumber(o.remainingTakerTokenAmount);
        const remainingMakerAmount = remainingTakerAmount.times(o.makerTokenAmount).div(o.takerTokenAmount);
        remainingQuantity = remainingQuantity.add(remainingMakerAmount);
      });
    }

    // we don't actually need to place any additional orders
    if (remainingQuantity.greaterThan(availableTokenBalance.times(band.minUnits).dividedBy(totalUnitsQuantity).toString())) {
      return;
    }

    const adjustedPrice = band.side === 'buy' ? price.minus(absoluteSpread) : price.add(absoluteSpread);

    let quantity = availableTokenBalance.times((band.units / totalUnitsQuantity).toString()).minus(remainingQuantity);
    if (band.side === 'buy') {
      // the quantity above is actually in quoteTokens, not baseTokens - convert based on price
      quantity = quantity.div(adjustedPrice).round();
    }

    try {
      const order = await this.tradingService.createLimitOrder({
        request: {
          account,
          baseTokenSymbol,
          quoteTokenSymbol,
          price: adjustedPrice.toString(),
          expirationDate: moment().add(band.expirationSeconds, 'seconds').toDate(),
          side: band.side,
          quantityInWei: quantity.toString()
        }
      });

      await this.orderRepo.create({ ...order, bandId: band._id, bound: true, valid: true, marketId: band.marketId });
      await this.logService.addBandLog({ bandId: band._id, message: `opened order of ${quantity.toString()} at ${adjustedPrice.toString()}`, severity: 'info' });
      await this.logService.addBandLog({ bandId: band._id, message: `band started ${band._id}`, severity: 'success' });
    } catch (err) {
      await this.logService.addBandLog({
        bandId: band._id,
        message: `error creating limit order: ${err.message}`,
        severity: 'critical'
      });
    }
  }

  public async stop(band: IStoredBand, immediateCancelation: boolean) {
    const existingOrders = await this.orderRepo.find({ bandId: band._id, bound: true });
    if (existingOrders && existingOrders.length > 0) {
      for (let i = 0; i < existingOrders.length; i++) {
        const order = existingOrders[i];
        if (immediateCancelation) {
          try {
            const txHash = await this.tradingService.cancelOrder({ orderHash: order.orderHash });
            this.logService.addBandLog({
              severity: 'info',
              bandId: band._id,
              message: `band ${band._id} canceled order ${order.id} w/ tx ${txHash}`
            });
            order.valid = false;
          } catch (err) {
            this.logService.addBandLog({
              severity: 'critical',
              bandId: band._id,
              message: `band ${band._id} failed to cancel order ${order.id}: ${err.message}`
            });
          }
        }

        order.bound = false;
        await this.orderRepo.update({ id: order.id }, order);
      }
    }

    this.logService.addBandLog({
      severity: 'success',
      bandId: band._id,
      message: `band ${band._id} stopped`
    });
  }

  public async validateRemove(bandId: string): Promise<IValidateRemoveResult> {
    const orders = await this.orderRepo.find({ bandId, bound: true });
    return {
      hasActiveOrders: orders.length > 0
    };
  }

  public async remove({ bandId, immediateCancelation }: IRemoveBandRequest) {
    const band = await this.bandRepo.findOne({ _id: bandId });
    if (!band) {
      throw new ServerError(`no band ${bandId} found`, 404);
    }

    if (immediateCancelation) {
      await this.stop(band, true);
    }

    await this.bandRepo.delete({ _id: band._id });
    this.logService.addMarketLog({
      severity: 'success',
      marketId: band.marketId,
      message: `band ${bandId} removed from market`
    });
  }

  public async getAvailableBalance({ side, tokenPair, market }: IGetLimitOrderQuantityParams) {
    const account = market.account;
    if (side === 'buy') {
      const balance = new BigNumber(await this.walletService.getBalance({ account, tokenAddress: tokenPair.tokenB.address }));
      if (balance.lessThan(market.minQuoteAmount)) {
        throw new Error(`balance is lower than minimum quote token amount: ${balance.toString()}/${market.minQuoteAmount}`);
      }

      return balance.lessThan(market.initialQuoteAmount) ? balance : new BigNumber(market.initialQuoteAmount);
    } else {
      const balance = new BigNumber(await this.walletService.getBalance({ account, tokenAddress: tokenPair.tokenA.address }));
      if (balance.lessThan(market.minBaseAmount)) {
        throw new Error(`balance is lower than minimum base token amount: ${balance.toString()}/${market.minBaseAmount}`);
      }

      return balance.lessThan(market.initialBaseAmount) ? balance : new BigNumber(market.initialBaseAmount);
    }
  }

  private async bandContainmentStatus({ price, band, order, baseDecimals }: IBandPriceCheckParams): Promise<BandContainmentStatus> {
    const absoluteSpread = getAbsoluteSpread({ price, spreadBps: band.spreadBps });

    const orderPrice = await getOrderPrice({
      order,
      side: band.side as 'buy' | 'sell',
      baseDecimals
    });
    const targetPrice = band.side === 'buy'
      ? price.minus(absoluteSpread)
      : price.add(absoluteSpread);

    const absoluteTolerance = price.times(band.toleranceBps.toString()).times(.0001);

    const isBelowLowerBound = orderPrice.lessThan(targetPrice.minus(absoluteTolerance));
    const isAboveUpperBound = orderPrice.greaterThan(targetPrice.add(absoluteTolerance));

    if (isBelowLowerBound) {
      return band.side === 'buy' ? 'no-loss-risk' : 'loss-risk';
    }

    if (isAboveUpperBound) {
      return band.side === 'buy' ? 'loss-risk' : 'no-loss-risk';
    }

    return 'contained';
  }

  private async getValidatedOrder(order: IStoredOrder) {
    // is it actually still valid?
    // is it expired?
    if (order.expirationUnixTimestampSec <= (new Date().getTime() / 1000)) {
      order.valid = false;
      order.bound = false;
      await this.orderRepo.update({ _id: order._id }, order);

      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `order ${order.id} expired`,
          severity: 'error'
        });
      }
      return;
    }

    let remoteOrder: Aqueduct.Api.Order;
    // is it invalid for some other reason?
    try {
      remoteOrder = await this.aqueductOrdersService.getById({ orderId: order.id });
    } catch (err) {
      console.error(`failed to get order by id: ${err.message}`);
      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `failed to get order by id ${order.id}: ${err.message} - treating as still valid`,
          severity: 'error'
        });
      }

      // if the server fails, we have to treat this order as valid, otherwise we may overextend
      return order;
    }

    if (remoteOrder.state !== 0) {
      order.bound = false;
      order.valid = false;

      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `order ${order.id} invalid with state ${remoteOrder.state} - removing, will refresh band`,
          severity: 'error'
        });
      }

      await this.orderRepo.update({ _id: order._id }, order);
      return;
    }

    order.remainingTakerTokenAmount = remoteOrder.remainingTakerTokenAmount;
    await this.orderRepo.update({ _id: order._id }, order);

    return order.remainingTakerTokenAmount !== '0' && order;
  }
}

type BandContainmentStatus = 'contained' | 'loss-risk' | 'no-loss-risk';

interface IBandPriceCheckParams {
  price: BigNumber;
  band: IStoredBand;
  order: IOrder;
  baseDecimals: number;
}
