import { IMarketStats } from '../services/market-service';
import { Repository } from './repository';

export interface IMarketStatsHistory extends IMarketStats {
  dateCreated: Date;
  marketId: string;
}

export interface IStoredMarketStatsHistory extends IMarketStatsHistory {
  _id: string;
}

export class MarketStatsHistoryRepository extends Repository<IMarketStatsHistory, IStoredMarketStatsHistory> {
}

export const marketStatsHistoryRepository = new MarketStatsHistoryRepository();
