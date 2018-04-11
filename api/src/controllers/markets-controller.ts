import { Body, Get, Post, Route, Tags } from 'tsoa';
import { IMarket, IStoredMarket, MarketRepository } from '../db/market-repository';

@Route('markets')
export class MarketsController {
  private readonly marketRepository = new MarketRepository();

  @Get()
  @Tags('Markets')
  public async get(): Promise<IStoredMarket[]> {
    return await this.marketRepository.find({});
  }

  @Post()
  @Tags('Markets')
  public async create(@Body() request: IMarket): Promise<IStoredMarket> {
    return await this.marketRepository.create(request);
  }
}
