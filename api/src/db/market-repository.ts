import { IRepository, Repository } from './repository';

export interface IToken {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
}

export interface ITokenPair {
  tokenA: IToken;
  tokenB: IToken;
  minimumQuantity: string;
  priceDecimals: number;
  baseVolume: string;
  quoteVolume: string;
}

export interface IMarket {
  label: string;
  baseTokenSymbol: string;
  maxBaseAmount: string;
  minBaseAmount: string;
  quoteTokenSymbol: string;
  maxQuoteAmount: string;
  minQuoteAmount: string;
  minEthAmount: string;
  cancellationMode: 'hard' | 'soft';
  active?: boolean;
}

export interface IStoredMarket extends IMarket {
  _id: string;
}

export class MarketRepository extends Repository<IMarket, IStoredMarket> {
}

export interface IMarketRepository extends IRepository<IMarket, IStoredMarket> {
}

export const marketRepository = new MarketRepository();
