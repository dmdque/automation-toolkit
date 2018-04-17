import { Repository } from './repository';

export interface IBand {
  marketId: string;
  ratio: number;
  spread: number;
  expirationSeconds: number;
  side: string;
}

export interface IStoredBand extends IBand {
  _id: string;
}

export class BandRepository extends Repository<IBand, IStoredBand> {
}

export const bandRepository = new BandRepository();
