import { Get, Route, Tags } from 'tsoa';
import { ITokenTicker, tickerDataCache } from '../cache/ticker-data-cache';
import { tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { ITokenPair } from '../db/market-repository';

@Route('token-pairs')
export class TokenPairsController {
  @Get()
  @Tags('TokenPairs')
  public async get(): Promise<ITokenPair[]> {
    return await tokenPairCache.getTokenPairs(config.networkId);
  }

  @Get('tickers')
  @Tags('TokenPairs')
  public getTickers(): ITokenTicker[] {
    return tickerDataCache.tickers;
  }
}
