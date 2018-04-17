import { IStoredBand } from '../db/band-repository';
import { Event } from './event';

export class BandStartedEvent extends Event<IStoredBand> {
  protected topic = 'band-started';
}

export const bandStartedEvent = new BandStartedEvent();
