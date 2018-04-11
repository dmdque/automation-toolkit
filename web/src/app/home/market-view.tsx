import { Dashboard } from 'api/api';
import { getPath } from 'common/paths';
import { History } from 'history';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Redirect } from 'react-router';
import { marketStore } from 'stores/market-store';
import './market-view.scss';

interface IMarketViewProps {
  history: History;
  match: {
    params: {
      id: string;
    };
  };
}

@observer
export class MarketView extends React.Component<IMarketViewProps> {
  @observable private market?: Dashboard.Api.IStoredMarket;

  constructor(public readonly props: IMarketViewProps) {
    super(props);
    this.loadMarket();
  }

  public componentDidUpdate(prevProps: IMarketViewProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      this.loadMarket();
    }
  }

  public render() {
    if (!this.market) {
      // something went wrong here - go back home
      return <Redirect to={getPath(p => p.home)} />;
    }

    return (
      <div className='market-view grow'>
        <h1>{this.market.label}</h1>
      </div>
    );
  }

  private loadMarket() {
    this.market = marketStore.markets.find(m => m._id === this.props.match.params.id);
  }
}
