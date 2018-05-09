import { Aqueduct } from 'aqueduct';

export interface ITokenTicker {
  id: string;
  name: string;
  symbol: string;
  usdPrice: string;
  btcPrice: string;
  hourlyPercentageChange: string;
  dailyPercentageChange: string;
  weeklyPercentageChange: string;
  dailyVolume: string;
  priceEth: string;
}

export class TickerDataCache {
  public tickers: ITokenTicker[];

  public async initialize() {
    this.tickers = await new Aqueduct.Api.ReportsService().getTickerData();

    new Aqueduct.Events.TickerSubscription().subscribe({}, data => {
      this.tickers = data.tickers;
    });
  }
}

export const tickerDataCache = new TickerDataCache();
