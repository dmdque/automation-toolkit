import { BigNumber } from 'bignumber.js';
import { ServerError } from '../errors/server-error';
import { PriceFeed } from './price-feed';

// tslint:disable-next-line
(global as any).fetch = require('node-fetch');
// tslint:disable-next-line
const cc: ICryptoCompareApi = require('cryptocompare');

interface ICryptoCompareApi {
  price<T extends string>(base: string, quote: T): Promise<{ [K in T]: number }>;
}

/**
 * Uses cryptocompare as a source
 * TODO: Only works for ETH as quote, probably
 */
export class DefaultPriceFeed extends PriceFeed {
  public async getPrice(baseSymbol: string, quoteSymbol: string): Promise<BigNumber> {
    let quote = quoteSymbol;
    if (quote !== 'WETH' && quote !== 'USD') {
      throw new ServerError('DefaultPriceFeed only supports WETH as a quote token', 400);
    }

    if (quote === 'WETH') {
      quote = 'ETH';
    }

    try {
      const priceResult = await cc.price(baseSymbol, quote);
      const price = priceResult[quote];
      if (!price || price === 0) {
        throw new ServerError(`failed to get price feed for ${baseSymbol} - cryptocompare returned nothing or a price of 0`);
      }

      return new BigNumber(price);
    } catch (err) {
      throw new ServerError(`failed to get price feed for ${baseSymbol}: ${err.message}`);
    }
  }
}
