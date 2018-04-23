import { Dashboard } from 'api/api';
import { BigNumber } from 'bignumber.js';
import { IScrollableGridColumn, ScrollableGrid } from 'common/grid/scrollable-grid';
import { LoadingScreen } from 'common/loading-screen';
import { Modal } from 'common/modal/modal';
import { toUnitAmount } from 'common/utils/unit-amount';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as moment from 'moment';
import * as React from 'react';
import './balance-history.scss';

interface IBalanceHistoryProps {
  marketId: string;
  tokenPair: Dashboard.Api.ITokenPair;
  onClose: () => void;
}

@observer
export class BalanceHistory extends React.Component<IBalanceHistoryProps> {
  @observable private statsHistory?: Dashboard.Api.IMarketStatsHistory[];

  constructor(public readonly props: IBalanceHistoryProps) {
    super(props);
    this.load();
  }

  public render() {
    return (
      <Modal title='Balance History' onClose={this.props.onClose} className='balance-history'>
        {this.getContent()}
      </Modal>
    );
  }

  private getContent() {
    if (!this.statsHistory) {
      return <LoadingScreen />;
    }

    const columns: IScrollableGridColumn<Dashboard.Api.IMarketStatsHistory>[] = [
      {
        header: 'Date',
        getElement: h => (
          <span>{moment(h.dateCreated).format('M/D/Y hh:mm A')}</span>
        ),
        widthPoints: 1
      },
      {
        header: `${this.props.tokenPair.tokenA.symbol} Balance`,
        getElement: h => (
          <span>{toUnitAmount({
            token: this.props.tokenPair.tokenA,
            value: h.baseBalance
          }).toFormat(4)} ({h.baseUsdBalance})</span>
        ),
        widthPoints: 1
      },
      {
        header: `${this.props.tokenPair.tokenB.symbol} Balance`,
        getElement: h => (
          <span>{toUnitAmount({
            token: this.props.tokenPair.tokenB,
            value: h.quoteBalance
          }).toFormat(4)} ({h.quoteUsdBalance})</span>
        ),
        widthPoints: 1
      },
      {
        header: `ETH Balance`,
        getElement: h => (
          <span>{toUnitAmount({
            token: { decimals: 18 },
            value: h.ethBalance
          }).toFormat(4)} ({h.ethUsdBalance})</span>
        ),
        widthPoints: 1
      },
      {
        header: 'USD Total',
        getElement: h => (
          <span>{new BigNumber(h.baseUsdBalance).plus(h.quoteUsdBalance).plus(h.ethUsdBalance).toFormat(2)}</span>
        ),
        widthPoints: 1
      }
    ];

    return <ScrollableGrid models={this.statsHistory} columns={columns} className='b-padding' />;
  }

  private async load() {
    this.statsHistory = await new Dashboard.Api.MarketsService().getStats({ marketId: this.props.marketId });
  }
}
