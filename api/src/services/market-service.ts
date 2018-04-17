import { bandRepository } from '../db/band-repository';
import { IStoredMarket, marketRepository } from '../db/market-repository';
import { ServerError } from '../errors/server-error';
import { BandService } from './band-service';
import { LogService } from './log-service';

export interface IStopMarketRequest {
  marketId: string;
}

export class MarketService {
  private readonly logService = new LogService();
  private readonly bandService = new BandService();

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

    const bands = await bandRepository.find({ marketId: market._id });
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      this.bandService.stop(band);
    }

    market.active = false;
    await marketRepository.update({ _id: market._id }, market);

    this.logService.addMarketLog({
      severity: 'success',
      message: `Successfully Stopped Market '${market.label}'`,
      marketId: market._id
    });

    return market;
  }
}
