import { ITokenPairCache } from '../../cache/token-pair-cache';
import { IToken, ITokenPair } from '../../db/market-repository';

export const ScamToken: IToken = {
  decimals: 18,
  address: '18293889823skdlsdl',
  name: 'ScamToken',
  symbol: 'SCT'
};

export const WackToken: IToken = {
  decimals: 18,
  address: '182938898zzzz23skdlsdl',
  name: 'WackToken',
  symbol: 'WAK'
};

export const tokenPair: ITokenPair = {
  tokenA: ScamToken,
  tokenB: WackToken,
  baseVolume: '0',
  minimumQuantity: '0',
  priceDecimals: 4,
  quoteVolume: '0'
};

export const tokenPairCacheFixture: ITokenPairCache = {
  getTokenPairs: async () => [tokenPair],
  getTokenBySymbol: async ({ symbol }: { networkId: number; symbol: string; }) => {
    if (symbol === ScamToken.symbol) { return ScamToken; }
    if (symbol === WackToken.symbol) { return WackToken; }
    throw new Error(`symbol ${symbol} not a valid token`);
  },
  getTokenPair: async ({ baseSymbol, quoteSymbol }: { networkId: number; baseSymbol: string; quoteSymbol: string; }) => {
    if (baseSymbol === ScamToken.symbol && quoteSymbol === WackToken.symbol) {
      return tokenPair;
    }

    throw new Error(`no matching token pairs for ${baseSymbol}/${quoteSymbol}`);
  }
};
