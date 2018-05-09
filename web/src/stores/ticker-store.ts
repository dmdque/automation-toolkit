import { Dashboard } from 'api/api';
import { BigNumber } from 'bignumber.js';
import { toUnitAmount } from 'common/utils/unit-amount';
import { observable } from 'mobx';

export class TickerStore {
  @observable public tickers: Dashboard.Api.ITokenTicker[];

  public async initialize() {
    await this.getTickers();

    setInterval(async () => {
      await this.getTickers();
    }, 30000);
  }

  public getTokenTicker(symbol: string) {
    return this.tickers.find(d => d.symbol === symbol);
  }

  public getTokenUsdEquivalent(token: { symbol: string, decimals: number }, value: string | number | BigNumber) {
    const ticker = this.tickers.find(d => d.symbol === token.symbol) as Dashboard.Api.ITokenTicker;

    return toUnitAmount({
      token,
      value
    }).times(ticker.usdPrice).toFormat(2);
  }

  public getMarketPrice(tp: Dashboard.Api.ITokenPair) {
    const tokenTickerData = tickerStore.getTokenTicker(tp.tokenA.symbol);
    if (!tokenTickerData) { return; }

    const b = tp.tokenB.symbol;
    if (b === 'WETH') {
      return new BigNumber(tokenTickerData.priceEth);
    }

    if (b === 'DAI') {
      return new BigNumber(tokenTickerData.usdPrice);
    }

    return;
  }

  private async getTickers() {
    this.tickers = await new Dashboard.Api.TokenPairsService().getTickers();
  }
}

export const tickerStore = new TickerStore();
