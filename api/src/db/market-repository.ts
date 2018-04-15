import { Repository } from './repository';

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
  initialBaseAmount: string;
  minBaseAmount: string;
  quoteTokenSymbol: string;
  initialQuoteAmount: string;
  minQuoteAmount: string;
  account: string;
  minEthAmount: string;
}

export interface IStoredMarket extends IMarket {
  _id: string;
}

export class MarketRepository extends Repository<IMarket, IStoredMarket> {
}
