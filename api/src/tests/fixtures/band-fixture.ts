import { bandRepository, IStoredBand } from '../../db/band-repository';
import { fixture } from './fixture';

export interface IBandFixtureParams {
  marketId: string;
  units: number;
  minUnits: number;
  spreadBps: number;
  toleranceBps: number;
  side: string;
}

export const bandFixture = fixture<IBandFixtureParams, IStoredBand>(async m => {
  return await bandRepository.create({
    expirationSeconds: 1000,
    marketId: m.marketId,
    minUnits: m.minUnits,
    side: m.side,
    spreadBps: m.spreadBps,
    toleranceBps: m.toleranceBps,
    units: m.units
  });
});
