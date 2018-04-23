import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { bandRepository, IStoredBand } from '../db/band-repository';
import { IStoredMarket, marketRepository } from '../db/market-repository';
import { IStoredOrder, orderRepository } from '../db/order-repository';
import { ServerError } from '../errors/server-error';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { DefaultPriceFeed } from './default-price-feed';
import { LogService } from './log-service';

interface IGetLimitOrderQuantityParams {
  side: 'buy' | 'sell';
  account: string;
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

export class BandService {
  private readonly logService = new LogService();

  public async start(band: IStoredBand) {
    const market = await marketRepository.findOne({ _id: band.marketId });
    if (!market) {
      throw new ServerError(`market ${band.marketId} doesn't exist`, 404);
    }

    const unbindOrders = async (orders: IStoredOrder[]) => {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        order.bound = false;
        await orderRepository.update({ _id: order._id }, order);
      }
    };

    // is there already an order bound?
    let existingOrders = await orderRepository.find({ bandId: band._id, bound: true });
    if (existingOrders && existingOrders.length > 0) {
      if (!market.active) {
        await unbindOrders(existingOrders);
        return;
      }

      let isValid = true;
      // is it actually still valid?
      const existingOrder = existingOrders[0];
      if (existingOrder.expirationUnixTimestampSec <= (new Date().getTime() / 1000)) {
        // expired
        existingOrder.bound = false;
        await orderRepository.update({ _id: existingOrder._id }, existingOrder);
        isValid = false;

        await this.logService.addBandLog({
          bandId: band._id,
          message: `order ${existingOrder.id} expired - removing, will refresh band`,
          severity: 'error'
        });
      }

      // invalid for some other reason
      const remoteOrder = await new Aqueduct.Api.OrdersService().getById({ orderId: existingOrder.id });
      if (remoteOrder.state !== 0) {
        existingOrder.bound = false;
        await orderRepository.update({ _id: existingOrder._id }, existingOrder);
        isValid = false;

        await this.logService.addBandLog({
          bandId: band._id,
          message: `order ${existingOrder.id} invalid with state ${remoteOrder.state} - removing, will refresh band`,
          severity: 'error'
        });
      }

      if (isValid) { return; }
    }

    if (!market.active) {
      return;
    }

    const { account, baseTokenSymbol, quoteTokenSymbol } = market;
    const tokenPair = await tokenPairCache.getTokenPair({
      baseSymbol: baseTokenSymbol,
      quoteSymbol: quoteTokenSymbol,
      networkId: config.networkId
    });

    const price = await new DefaultPriceFeed().getPrice(baseTokenSymbol, quoteTokenSymbol);
    const absoluteSpread = price.times(band.spreadBps.toString()).times(.0001);
    const adjustedPrice = band.side === 'buy' ? price.minus(absoluteSpread) : price.add(absoluteSpread);
    const allBands = await bandRepository.find({ marketId: market._id, side: band.side });
    const totalRatioQuantity = allBands.map(b => b.ratio).reduce((a, b) => a + b);

    let availableTokenBalance: BigNumber;
    try {
      availableTokenBalance = await this.getAvailableBalance({
        side: band.side as 'buy' | 'sell',
        account,
        tokenPair,
        market
      });
    } catch (err) {
      this.logService.addBandLog({ bandId: band._id, message: err.message, severity: 'error' });
      return;
    }

    let quantity = availableTokenBalance.times((band.ratio / totalRatioQuantity).toString());
    if (band.side === 'buy') {
      // the quantity above is actually in quoteTokens, not baseTokens - convert based on price
      quantity = quantity.div(adjustedPrice).round();
    }

    try {
      const order = await new AqueductRemote.Api.TradingService().createLimitOrder({
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
      await orderRepository.create({
        ...order,
        bandId: band._id,
        bound: true
      });
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
    const existingOrders = await orderRepository.find({ bandId: band._id, bound: true });
    if (existingOrders && existingOrders.length > 0) {
      for (let i = 0; i < existingOrders.length; i++) {
        const order = existingOrders[i];
        if (immediateCancelation) {
          try {
            const txHash = await new AqueductRemote.Api.TradingService().cancelOrder({ orderHash: order.orderHash });
            this.logService.addBandLog({
              severity: 'info',
              bandId: band._id,
              message: `band ${band._id} canceled order ${order.id} w/ tx ${txHash}`
            });
          } catch (err) {
            this.logService.addBandLog({
              severity: 'critical',
              bandId: band._id,
              message: `band ${band._id} failed to cancel order ${order.id}: ${err.message}`
            });
          }
        }

        order.bound = false;
        await orderRepository.update({ id: order.id }, order);
      }
    }

    this.logService.addBandLog({
      severity: 'success',
      bandId: band._id,
      message: `band ${band._id} stopped`
    });
  }

  public async validateRemove(bandId: string): Promise<IValidateRemoveResult> {
    const order = await orderRepository.findOne({ bandId, bound: true });
    return {
      hasActiveOrders: !!order
    };
  }

  public async remove({ bandId, immediateCancelation }: IRemoveBandRequest) {
    const band = await bandRepository.findOne({ _id: bandId });
    if (!band) {
      throw new ServerError(`no band ${bandId} found`, 404);
    }

    if (immediateCancelation) {
      await this.stop(band, true);
    }

    await bandRepository.delete({ _id: band._id });
    this.logService.addMarketLog({
      severity: 'success',
      marketId: band.marketId,
      message: `band ${bandId} removed from market`
    });
  }

  private async getAvailableBalance({ side, account, tokenPair, market }: IGetLimitOrderQuantityParams) {
    if (side === 'buy') {
      const balance = new BigNumber(await new AqueductRemote.Api.WalletService().getBalance({ account, tokenAddress: tokenPair.tokenB.address }));
      if (balance.lessThan(market.minQuoteAmount)) {
        throw new Error(`balance is lower than minimum quote token amount: ${balance.toString()}/${market.minQuoteAmount}`);
      }

      return balance.lessThan(market.initialQuoteAmount) ? balance : new BigNumber(market.initialQuoteAmount);
    } else {
      const balance = new BigNumber(await new AqueductRemote.Api.WalletService().getBalance({ account, tokenAddress: tokenPair.tokenA.address }));
      if (balance.lessThan(market.minBaseAmount)) {
        throw new Error(`balance is lower than minimum base token amount: ${balance.toString()}/${market.minBaseAmount}`);
      }

      return balance.lessThan(market.initialBaseAmount) ? balance : new BigNumber(market.initialBaseAmount);
    }
  }
}
