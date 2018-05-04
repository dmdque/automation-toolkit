import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { ITokenPairCache, tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { bandRepository, IBandRepository, IStoredBand } from '../db/band-repository';
import { IMarketRepository, IStoredMarket, marketRepository } from '../db/market-repository';
import { IOrder, IOrderRepository, orderRepository, State } from '../db/order-repository';
import { ServerError } from '../errors/server-error';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { getAbsoluteSpread } from '../utils/conversion';
import { getOrderPrice } from '../utils/order-utils';
import { ILogService, LogService } from './log-service';
import { IOrderService, OrderService } from './order-service';
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
  hardCancelation: boolean;
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

export type BandContainmentStatus = 'contained' | 'loss-risk' | 'no-loss-risk';

export interface IBandPriceCheckParams {
  price: BigNumber;
  band: IStoredBand;
  order: IOrder;
  baseDecimals: number;
}

const bandProcessingMap: { [bandId: string]: 1 | undefined } = {};

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
  private readonly orderService: IOrderService;

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
    this.orderService = new OrderService(this.tradingService, this.aqueductOrdersService);
  }

  public async start(band: IStoredBand) {
    if (bandProcessingMap[band._id] === 1) { return; }

    bandProcessingMap[band._id] = 1;
    try {
      await this.cycle(band);
      bandProcessingMap[band._id] = undefined;
    } catch (err) {
      bandProcessingMap[band._id] = undefined;
      throw err;
    }
  }

  public async stop(band: IStoredBand) {
    await this.logService.addBandLog({
      severity: 'success',
      bandId: band._id,
      message: `band ${band._id} stopped`
    });
  }

  public async validateRemove(bandId: string): Promise<IValidateRemoveResult> {
    const orders = await this.orderRepo.find({ bandId, state: 0 });
    return {
      hasActiveOrders: orders.length > 0
    };
  }

  public async remove({ bandId, hardCancelation }: IRemoveBandRequest) {
    const band = await this.bandRepo.findOne({ _id: bandId });
    if (!band) {
      throw new ServerError(`no band ${bandId} found`, 404);
    }

    const orders = await this.orderRepo.find({ bandId, state: 0 });
    for (let order of orders) {
      if (hardCancelation) {
        await this.orderService.cancelOrder(order);
      } else {
        await this.orderService.softCancelOrder(order);
      }
    }

    await this.stop(band);
    await this.bandRepo.delete({ _id: band._id });
    await this.logService.addMarketLog({
      severity: 'success',
      marketId: band.marketId,
      message: `band ${bandId} removed from market`
    });
  }

  public async getAvailableBalance({ side, tokenPair, market }: IGetLimitOrderQuantityParams) {
    if (side === 'buy') {
      const balance = new BigNumber(await this.walletService.getBalance({ tokenAddress: tokenPair.tokenB.address }));
      if (balance.lessThan(market.minQuoteAmount)) {
        throw new Error(`balance is lower than minimum quote token amount: ${balance.toString()}/${market.minQuoteAmount}`);
      }

      return balance.lessThan(market.initialQuoteAmount) ? balance : new BigNumber(market.initialQuoteAmount);
    } else {
      const balance = new BigNumber(await this.walletService.getBalance({ tokenAddress: tokenPair.tokenA.address }));
      if (balance.lessThan(market.minBaseAmount)) {
        throw new Error(`balance is lower than minimum base token amount: ${balance.toString()}/${market.minBaseAmount}`);
      }

      return balance.lessThan(market.initialBaseAmount) ? balance : new BigNumber(market.initialBaseAmount);
    }
  }

  public async bandContainmentStatus({ price, band, order, baseDecimals }: IBandPriceCheckParams): Promise<BandContainmentStatus> {
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

  /**
   * Get the band with the highest spread
   */
  public async getBottomBand({ side, marketId }: { side: 'buy' | 'sell', marketId: string }) {
    const bands = await this.bandRepo.find({ marketId, side });
    if (!bands.length) { return undefined; }

    return bands.reduce((a, b) => a.spreadBps > b.spreadBps ? a : b);
  }

  private async cycle(band: IStoredBand) {
    const market = await this.marketRepo.findOne({ _id: band.marketId });
    if (!market) {
      throw new ServerError(`market ${band.marketId} doesn't exist`, 404);
    }

    const { baseTokenSymbol, quoteTokenSymbol } = market;
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
    let existingOrders = await this.orderRepo.find({ bandId: band._id, state: State.Open });
    if (existingOrders && existingOrders.length > 0) {
      // market got turned off, clean up any orders that are still showing as bound
      if (!market.active) {
        return;
      }

      for (let i = 0; i < existingOrders.length; i++) {
        let order = existingOrders[i];
        const validatedOrder = await this.orderService.getValidatedOrder(order);
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
                await this.logService.addCancelLog({ txHash, order, marketId: band.marketId });
                await this.logService.addBandLog({
                  severity: 'info',
                  bandId: band._id,
                  message: `band ${band._id} canceled order due to price changes ${order.id} w/ tx ${txHash}`
                });

                console.log(`band ${band._id} canceled order due to price changes ${order.id} w/ tx ${txHash}`);

                order.state = State.Canceled;
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
              // it's not going to lose us money (right now), soft cancel it
              await this.orderService.softCancelOrder(order);
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
      quantity = quantity.div(adjustedPrice);
    }

    try {
      const order = await this.tradingService.createLimitOrder({
        request: {
          baseTokenSymbol,
          quoteTokenSymbol,
          price: adjustedPrice.toString(),
          expirationDate: moment().add(band.expirationSeconds, 'seconds').toDate(),
          side: band.side,
          quantityInWei: quantity.round().toString()
        }
      });

      await this.orderRepo.create({ ...order, bandId: band._id, marketId: band.marketId, softCanceled: false });
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
}
