import { BigNumber } from 'bignumber.js';
import { tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { bandRepository } from '../db/band-repository';
import { IMarket, IStoredMarket, marketRepository } from '../db/market-repository';
import { IMarketStatsHistory, marketStatsHistoryRepository } from '../db/market-stats-history-repository';
import { orderRepository } from '../db/order-repository';
import { ServerError } from '../errors/server-error';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { toUnitAmount } from '../utils/conversion';
import { BandService } from './band-service';
import { LogService } from './log-service';

export interface IStopMarketRequest {
  marketId: string;
  immediateCancelation: boolean;
}

export interface IValidateStopResult {
  hasActiveBands: boolean;
}

export interface IMarketStats {
  baseBalance: string;
  baseUsdBalance: string;
  quoteBalance: string;
  quoteUsdBalance: string;
  ethBalance: string;
  ethUsdBalance: string;
  openBaseAmount: string;
  openQuoteAmount: string;
}

export class MarketService {
  private readonly logService = new LogService();
  private readonly bandService = new BandService();

  public async create(market: IMarket) {
    // make sure that there isn't another market for this pair already
    const existingMarket = await marketRepository.findOne({
      baseTokenSymbol: market.baseTokenSymbol,
      quoteTokenSymbol: market.quoteTokenSymbol
    });
    if (existingMarket) {
      throw new ServerError(`market already exists for ${market.baseTokenSymbol}/${market.quoteTokenSymbol}`, 400);
    }

    return await marketRepository.create(market);
  }

  public async start(marketId: string): Promise<IStoredMarket> {
    const market = await marketRepository.findOne({ _id: marketId });
    if (!market) {
      throw new ServerError(`market ${marketId} not found`, 404);
    }

    if (market.active) {
      throw new ServerError(`market ${marketId} already active`, 400);
    }

    this.logService.addMarketLog({
      severity: 'info',
      message: `Starting Market '${market.label}'`,
      marketId: market._id
    });

    const bands = await bandRepository.find({ marketId: market._id });
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      await this.logService.addBandLog({ bandId: band._id, message: `starting band ${band._id}`, severity: 'info' });
      this.bandService.start(band);
    }

    market.active = true;
    await marketRepository.update({ _id: market._id }, market);

    this.logService.addMarketLog({
      severity: 'success',
      message: `Successfully Started Market '${market.label}'`,
      marketId: market._id
    });

    return market;
  }

  public async stop(request: IStopMarketRequest) {
    const { marketId } = request;

    const market = await marketRepository.findOne({ _id: marketId });
    if (!market) {
      throw new ServerError(`market ${marketId} not found`, 404);
    }

    if (!market.active) {
      throw new ServerError(`market ${marketId} already active`, 400);
    }

    this.logService.addMarketLog({
      severity: 'info',
      message: `Stopping Market '${market.label}'`,
      marketId: market._id
    });

    market.active = false;
    await marketRepository.update({ _id: market._id }, market);

    const bands = await bandRepository.find({ marketId: market._id });
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      await this.bandService.stop(band, request.immediateCancelation);
    }

    this.logService.addMarketLog({
      severity: 'success',
      message: `Successfully Stopped Market '${market.label}'`,
      marketId: market._id
    });

    return market;
  }

  public async validateStop(marketId: string): Promise<IValidateStopResult> {
    const bands = await bandRepository.find({ marketId });
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];

      const order = await orderRepository.findOne({ bandId: band._id, bound: true });
      if (order) {
        return {
          hasActiveBands: true
        };
      }
    }

    return {
      hasActiveBands: false
    };
  }

  public async deleteMarket(marketId: string) {
    const market = await marketRepository.findOne({ _id: marketId });
    if (!market) {
      throw new ServerError(`market ${marketId} not found`, 404);
    }

    if (market.active) {
      throw new ServerError(`market ${marketId} is active; can't delete an active market. stop first`);
    }

    await marketRepository.delete({ _id: marketId });
  }

  public async generateStats(marketId: string) {
    const market = await marketRepository.findOne({ _id: marketId });
    if (!market) {
      throw new ServerError(`market ${marketId} not found`, 404);
    }

    const { account, baseTokenSymbol, quoteTokenSymbol } = market;
    const tokenPair = await tokenPairCache.getTokenPair({
      baseSymbol: baseTokenSymbol,
      quoteSymbol: quoteTokenSymbol,
      networkId: config.networkId
    });

    const walletService = new AqueductRemote.Api.WalletService();
    const baseBalance = (await walletService.getBalance({ account, tokenAddress: tokenPair.tokenA.address })).toString();
    const quoteBalance = (await walletService.getBalance({ account, tokenAddress: tokenPair.tokenB.address })).toString();
    const ethBalance = (await walletService.getEthBalance({ account })).toString();
    const bands = await bandRepository.find({ marketId: market._id });

    let openQuoteAmount = new BigNumber(0);
    const buyBands = bands.filter(b => b.side === 'buy');
    for (let i = 0; i < buyBands.length; i++) {
      const buyBand = buyBands[i];
      const orders = await orderRepository.find({ bandId: buyBand._id, bound: true, valid: true });
      orders.forEach(o => openQuoteAmount = openQuoteAmount.add(o.makerTokenAmount));
    }

    let openBaseAmount = new BigNumber(0);
    const sellBands = bands.filter(b => b.side === 'sell');
    for (let i = 0; i < sellBands.length; i++) {
      const sellBand = sellBands[i];
      const orders = await orderRepository.find({ bandId: sellBand._id, bound: true, valid: true });
      orders.forEach(o => openBaseAmount = openBaseAmount.add(o.makerTokenAmount));
    }

    const priceFeed = config.priceFeed;
    const baseUnitBalance = toUnitAmount({ token: tokenPair.tokenA, value: baseBalance });
    const baseUsdBalance = (await priceFeed.getPrice(baseTokenSymbol, 'USD')).times(baseUnitBalance).round(2);
    const quoteUnitBalance = toUnitAmount({ token: tokenPair.tokenB, value: quoteBalance });
    const quoteUsdBalance = (await priceFeed.getPrice(quoteTokenSymbol, 'USD')).times(quoteUnitBalance).round(2);
    const ethUnitBalance = toUnitAmount({ token: { decimals: 18 }, value: ethBalance });
    const ethUsdBalance = (await priceFeed.getPrice('ETH', 'USD')).times(ethUnitBalance).round(2);

    const stats: IMarketStats = {
      baseBalance,
      quoteBalance,
      ethBalance,
      baseUsdBalance: baseUsdBalance.toString(),
      quoteUsdBalance: quoteUsdBalance.toString(),
      ethUsdBalance: ethUsdBalance.toString(),
      openBaseAmount: openBaseAmount.toString(),
      openQuoteAmount: openQuoteAmount.toString()
    };

    const latestStats = await this.getLatestStats(marketId);
    if (!latestStats || (latestStats.baseBalance !== stats.baseBalance || latestStats.quoteBalance !== stats.quoteBalance
      || latestStats.ethBalance !== stats.ethBalance || latestStats.openBaseAmount !== stats.openBaseAmount
      || latestStats.openQuoteAmount !== stats.openQuoteAmount)) {
      await marketStatsHistoryRepository.create({
        ...stats,
        marketId: market._id,
        dateCreated: new Date()
      });
    }
  }

  public async getLatestStats(marketId: string): Promise<IMarketStats> {
    const stats = await marketStatsHistoryRepository.find({ marketId: marketId }, {
      limit: 1,
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      }
    });

    return stats[0];
  }

  public async getStats(marketId: string): Promise<IMarketStatsHistory[]> {
    return await marketStatsHistoryRepository.find({ marketId: marketId }, {
      limit: 100,
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      }
    });
  }
}
