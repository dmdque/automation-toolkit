import { Body, Get, Post, Route, Tags } from 'tsoa';
import { IMarket, IStoredMarket, marketRepository } from '../db/market-repository';
import { IStopMarketRequest, MarketService } from '../services/market-service';

@Route('markets')
export class MarketsController {
  private readonly marketService = new MarketService();

  @Get()
  @Tags('Markets')
  public async get(): Promise<IStoredMarket[]> {
    return await marketRepository.find({});
  }

  @Post()
  @Tags('Markets')
  public async create(@Body() request: IMarket): Promise<IStoredMarket> {
    return await marketRepository.create(request);
  }

  @Post('start/{id}')
  @Tags('Markets')
  public async startMarket(id: string) {
    return await this.marketService.start(id);
  }

  @Post('stop')
  @Tags('Markets')
  public async stopMarket(@Body() request: IStopMarketRequest) {
    return await this.marketService.stop(request);
  }
}
