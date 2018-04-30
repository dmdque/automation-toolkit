import { IStoredMarket, marketRepository } from '../../db/market-repository';
import { fixture } from './fixture';
import { ScamToken, WackToken } from './tokens';

export interface IMarketFixtureParams {
  label: string;
  initialBaseAmount: string;
  initialQuoteAmount: string;
  minBaseAmount: string;
  minQuoteAmount: string;
  minEthAmount: string;
}

export const marketFixture = fixture<IMarketFixtureParams, IStoredMarket>(async m => {
  return await marketRepository.create({
    baseTokenSymbol: ScamToken.symbol,
    quoteTokenSymbol: WackToken.symbol,
    label: m.label,
    initialBaseAmount: m.initialBaseAmount,
    initialQuoteAmount: m.initialQuoteAmount,
    minBaseAmount: m.minBaseAmount,
    minEthAmount: m.minEthAmount,
    minQuoteAmount: m.minQuoteAmount,
    active: true
  });
});
