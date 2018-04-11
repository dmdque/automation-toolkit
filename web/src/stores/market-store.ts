import { Dashboard } from 'api/api';
import { observable } from 'mobx';

export class MarketStore {
  @observable public markets: Dashboard.Api.IStoredMarket[];

  public async initialize() {
    this.markets = await new Dashboard.Api.MarketsService().get();
  }
}

export const marketStore = new MarketStore();
