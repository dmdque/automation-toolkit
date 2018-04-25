import { IRepository, Repository } from './repository';

export interface IBand {
  marketId: string;
  units: number;
  minUnits: number;
  spreadBps: number;
  toleranceBps: number;
  expirationSeconds: number;
  side: string;
}

export interface IStoredBand extends IBand {
  _id: string;
}

export class BandRepository extends Repository<IBand, IStoredBand> {}
export interface IBandRepository extends IRepository<IBand, IStoredBand> {}

export const bandRepository = new BandRepository();
