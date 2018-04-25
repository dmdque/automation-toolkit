import { BigNumber } from 'bignumber.js';

export abstract class PriceFeed {
  public abstract getPrice(baseSymbol: string, quoteSymbol: string): Promise<BigNumber>;
}
