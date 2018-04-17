import { Dashboard } from 'api/api';
import { LoadingScreen } from 'common/loading-screen';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
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

    return (
      <div className='bands fl co grow'>
        {['sell', 'buy'].map((s: 'buy' | 'sell') => {
          const sideBands = bands.filter(b => b.side === s).sort((a, b) => {
            if (a.spread < b.spread) { return -1; }
            if (a.spread > b.spread) { return 1; }
            return 0;
          });

          return <BandList key={s} tokenPair={this.props.tokenPair} side={s} bands={s === 'buy' ? sideBands : sideBands.reverse()}
            onCreate={this.load} marketId={this.props.marketId} />;
        })}
      </div>
    );
  }

  private load = async () => {
    this.bands = undefined;
    this.bands = await new Dashboard.Api.BandsService().get({ marketId: this.props.marketId });
  }
}
