import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { ServerError } from '../errors/server-error';
import { sleep } from '../utils/sleep';
import { PriceFeed } from './price-feed';

// tslint:disable-next-line
(global as any).fetch = require('node-fetch');
// tslint:disable-next-line
const cc: ICryptoCompareApi = require('cryptocompare');

interface ICryptoCompareApi {
  price<T extends string>(base: string, quote: T): Promise<{ [K in T]: number }>;
}

interface ICachedPrice {
  price: BigNumber;
  expiration: Date;
}

const cache: { [symbols: string]: ICachedPrice | undefined } = {};

interface ICachePriceParams {
  baseSymbol: string;
  quoteSymbol: string;
  price: BigNumber;
  seconds: number;
}

const cachePrice = ({ baseSymbol, quoteSymbol, price, seconds }: ICachePriceParams) => {
  cache[`${baseSymbol}:${quoteSymbol}`] = {
    price,
    expiration: moment().add(seconds, 'seconds').toDate()
  };
};

const getCachedPrice = ({ baseSymbol, quoteSymbol }: { baseSymbol: string; quoteSymbol: string }) => {
  const cached = cache[`${baseSymbol}:${quoteSymbol}`];
  if (cached) {
    if (new Date() > cached.expiration) {
      return cache[`${baseSymbol}:${quoteSymbol}`] = undefined;
    }
  }

  return cached;
};

/**
 * Uses cryptocompare as a source
 * TODO: Only works for ETH as quote, probably
 */
export class DefaultPriceFeed extends PriceFeed {
  public async getPrice(baseSymbol: string, quoteSymbol: string): Promise<BigNumber> {
    const cachedPrice = getCachedPrice({ baseSymbol, quoteSymbol });
    if (cachedPrice) {
      return cachedPrice.price;
    }

    let quote = quoteSymbol;
    if (quote !== 'WETH' && quote !== 'USD') {
      throw new ServerError('DefaultPriceFeed only supports WETH as a quote token', 400);
    }

    if (quote === 'WETH') {
      quote = 'ETH';
    }

    let base = baseSymbol;
    if (base === 'WETH') {
      base = 'ETH';
    }

    try {
      const maxTries = 10;
      let tries = 0;
      let price: number;

      while (true) {
        tries++;
        try {
          const priceResult = await cc.price(base, quote);
          price = priceResult[quote];
          if (!price || price === 0) {
            throw new ServerError(`failed to get price feed for ${base}/${quote} - cryptocompare returned nothing or a price of 0`);
          }

          break;
        } catch (err) {
          if (tries === maxTries) {
            throw err;
          }

          console.info(`failed to get price feed for ${base}/${quote} on retry ${tries}/${maxTries} - trying again in 1500ms`);
          await sleep(1500);
        }
      }

      const priceBn = new BigNumber(price);
      cachePrice({
        baseSymbol,
        quoteSymbol,
        price: priceBn,
        seconds: 30
      });

      return priceBn;
    } catch (err) {
      throw new ServerError(`failed to get price feed for ${base}/${quote}: ${err.message || JSON.stringify(err)}`);
    }
  }
}
