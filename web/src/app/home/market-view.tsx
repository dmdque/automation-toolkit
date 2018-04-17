import { Dashboard } from 'api/api';
import { flashMessageStore } from 'app/flash-message/flash-message-store';
import { getPath } from 'common/paths';
import { History } from 'history';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Redirect } from 'react-router';
import { marketStore } from 'stores/market-store';
import { tokenPairStore } from 'stores/token-pair-store';
import { Bands } from './bands/bands';
import { LogViewer } from './log-viewer/log-viewer';
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
  @observable private isStarted = false;
  @observable private isViewingLogs = false;

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

    const { baseTokenSymbol, quoteTokenSymbol } = this.market;
    const tokenPair = tokenPairStore.getTokenPairsBySymbols({ baseTokenSymbol, quoteTokenSymbol });

    return (
      <div className='market-view grow fl co'>
        <div className='fl market-view-header'>
          <h1>{this.market.label}</h1>
          <div className={`control start fl vc ${!this.isStarted ? 'active' : 'inactive'}`} onClick={this.onStart(this.market)}>
            <i className='fa fa-play' />
            <span>Start</span>
          </div>
          <div className={`control stop fl vc ${this.isStarted ? 'active' : 'inactive'}`} onClick={this.onStop(this.market)}>
            <i className='fa fa-stop' />
            <span>Stop</span>
          </div>
          <div className={`control logs fl vc`} onClick={this.onViewLogs}>
            <i className='fa fa-list' />
            <span>Logs</span>
          </div>
        </div>
        <Bands tokenPair={tokenPair} marketId={this.market._id} />
        {this.isViewingLogs && <LogViewer onClose={this.onCloseViewLogs} marketId={this.market._id} />}
      </div>
    );
  }

  private loadMarket() {
    this.market = marketStore.markets.find(m => m._id === this.props.match.params.id);
    this.isStarted = !!(this.market && this.market.active);
  }

  private onStart = (market: Dashboard.Api.IStoredMarket) => async () => {
    try {
      await new Dashboard.Api.MarketsService().startMarket({ id: market._id });
      await this.refresh();
    } catch (err) {
      flashMessageStore.addMessage({
        content: err.message,
        type: 'error'
      });
    }
  }

  private onStop = (market: Dashboard.Api.IStoredMarket) => async () => {
    try {
      await new Dashboard.Api.MarketsService().stopMarket({
        request: {
          marketId: market._id
        }
      });
      await this.refresh();
    } catch (err) {
      flashMessageStore.addMessage({
        content: err.message,
        type: 'error'
      });
    }
  }

  private async refresh() {
    await marketStore.initialize();
    this.loadMarket();
  }

  private readonly onViewLogs = () => this.isViewingLogs = true;
  private readonly onCloseViewLogs = () => this.isViewingLogs = false;
}
