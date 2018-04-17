import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';

export type TickerCallback = () => void;

export class TickerService {
  private tickerData: Promise<Aqueduct.Api.ITokenTicker[]>;
  private callbacks = new Array<TickerCallback>();

  public async start() {
    this.tickerData = new Aqueduct.Api.ReportsService().getTickerData();

    new Aqueduct.Events.TickerSubscription().subscribe({}, data => {
      this.tickerData = Promise.resolve(data.tickers);
      this.callbacks.forEach(cb => cb());
    });
  }

  public async getPrice(token: Aqueduct.Api.IToken) {
    const tickerData = await this.tickerData;

    return this.getPriceFromTickerData(tickerData, token);
  }

  public async onChange(cb: TickerCallback) {
    this.callbacks.push(cb);
  }

  private getPriceFromTickerData(tickerData: Aqueduct.Api.ITokenTicker[], token: Aqueduct.Api.IToken) {
    const tokenTickerData = tickerData.find(d => d.symbol === token.symbol);
    if (!tokenTickerData) {
      throw new Error(`couldn't get price for ${token.symbol}; not found in TickerData`);
    }

    return new BigNumber(tokenTickerData.priceEth);
  }
}

export const tickerService = new TickerService();
