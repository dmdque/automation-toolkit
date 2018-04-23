import { BigNumber } from 'bignumber.js';

export abstract class PriceFeed {
  public abstract getPrice(baseSymbol: string, quoteSymbol: 'ETH' | 'USD'): Promise<BigNumber>;
}
