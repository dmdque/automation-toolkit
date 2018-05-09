import { Dashboard } from 'api/api';
import { LoadingScreen } from 'common/loading-screen';
import { getAbsoluteSpread } from 'common/utils/prices';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { tickerStore } from 'stores/ticker-store';
import { BandList } from './band-list';
import './bands.scss';

interface IBandsProps {
  tokenPair: Dashboard.Api.ITokenPair;
  marketId: string;
}

@observer
export class Bands extends React.Component<IBandsProps> {
  @observable private bands?: Dashboard.Api.IStoredBand[];

  constructor(public readonly props: IBandsProps) {
    super(props);
    this.load();
  }

  public componentDidUpdate(nextProps: IBandsProps) {
    if (this.props.marketId !== nextProps.marketId) {
      this.load();
    }
  }

  public render() {
    const bands = this.bands;
    if (!bands) {
      return <LoadingScreen />;
    }

    const tokenPrice = tickerStore.getMarketPrice(this.props.tokenPair);
    const spread = this.getSpread(bands);
    return (
      <div className='bands fl co grow'>
        {this.sideBand(bands, 'sell')}
        <div className='midpoint-bar fl c t-margin'>
          <span className='r-margin'>
            <span className='label'>Current Market Price</span>
            <span className='value'>{tokenPrice ? tokenPrice.toFormat(this.props.tokenPair.priceDecimals) : '-'}</span>
          </span>
          <span>
            <span className='label'>Approximate Price Spread</span>
            <span className='value'>{spread ? spread.toFormat(this.props.tokenPair.priceDecimals) : '-'}</span>
          </span>
        </div>
        {this.sideBand(bands, 'buy')}
      </div>
    );
  }

  private sideBand(bands: Dashboard.Api.IStoredBand[], side: 'buy' | 'sell') {
    return (
      <BandList key={side} tokenPair={this.props.tokenPair} side={side} bands={this.getSideBands(bands, side)}
        onCreate={this.load} marketId={this.props.marketId} onRemove={this.load} />
    );
  }

  private load = async () => {
    this.bands = undefined;
    this.bands = await new Dashboard.Api.BandsService().get({ marketId: this.props.marketId });
  }

  private getSpread(bands: Dashboard.Api.IStoredBand[]) {
    const sellBands = this.getSideBands(bands, 'sell');
    const buyBands = this.getSideBands(bands, 'buy');

    if (buyBands.length === 0 || sellBands.length === 0) { return; }

    const price = tickerStore.getMarketPrice(this.props.tokenPair);
    if (!price) { return; }

    const bestSell = sellBands[sellBands.length - 1];
    const sellAbsoluteSpread = getAbsoluteSpread(price, bestSell.spreadBps);
    if (!sellAbsoluteSpread) {
      return;
    }

    const bestBuy = buyBands[0];
    const buyAbsoluteSpread = getAbsoluteSpread(price, bestBuy.spreadBps);
    if (!buyAbsoluteSpread) {
      return;
    }

    const sellPrice = price.plus(sellAbsoluteSpread);
    const buyPrice = price.minus(buyAbsoluteSpread);

    return sellPrice.minus(buyPrice);
  }

  private getSideBands(bands: Dashboard.Api.IStoredBand[], side: 'buy' | 'sell') {
    const sideBands = bands.filter(b => b.side === side).sort((a, b) => {
      if (a.spreadBps < b.spreadBps) { return -1; }
      if (a.spreadBps > b.spreadBps) { return 1; }
      return 0;
    });
    return side === 'buy' ? sideBands : sideBands.reverse();
  }
}
