import { Dashboard } from 'api/api';
import { toUnitAmount } from 'common/utils/unit-amount';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import './market-stats.scss';

interface IMarketStatsProps {
  market: Dashboard.Api.IStoredMarket;
  tokenPair: Dashboard.Api.ITokenPair;
}

interface ITokenStatsParams {
  token: { decimals: number; symbol: string; name: string };
  minAmount: string;
  initialAmount?: string;
  balance?: string;
  open?: {
    value?: string;
  };
}

@observer
export class MarketStats extends React.Component<IMarketStatsProps> {
  @observable private marketStats?: Dashboard.Api.IMarketStats;
  private interval: any;

  constructor(public readonly props: IMarketStatsProps) {
    super(props);
    this.startPolling();
  }

  public componentDidUpdate(prevProps: IMarketStatsProps) {
    if (this.props.market._id !== prevProps.market._id) {
      this.load();
    }
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public render() {
    return (
      <div className='market-stats fl'>
        {this.tokenStat({
          token: this.props.tokenPair.tokenA,
          minAmount: this.props.market.minBaseAmount,
          initialAmount: this.props.market.initialBaseAmount,
          balance: this.marketStats && this.marketStats.baseBalance,
          open: {
            value: this.marketStats && this.marketStats.openBaseAmount
          }
        })}
        {this.tokenStat({
          token: this.props.tokenPair.tokenB,
          minAmount: this.props.market.minQuoteAmount,
          initialAmount: this.props.market.initialQuoteAmount,
          balance: this.marketStats && this.marketStats.quoteBalance,
          open: {
            value: this.marketStats && this.marketStats.openQuoteAmount
          }
        })}
        {this.tokenStat({
          token: { decimals: 18, name: 'Ether', symbol: 'ETH' },
          minAmount: this.props.market.minEthAmount,
          balance: this.marketStats && this.marketStats.ethBalance
        })}
      </div>
    );
  }

  private readonly tokenStat = ({ token, minAmount, initialAmount, balance, open }: ITokenStatsParams) => {
    return (
      <div className='market-stats-token-container'>
        <div className='market-stats-token-label'>
          <span>{token.symbol}</span>
          <span className='token-name'>{token.name}</span>
        </div>
        <div className='market-stats-line-item'>
          {initialAmount && <span className='r-margin'>
            <span className='market-stats-amount-label'>Initial Amount</span>
            <span>{toUnitAmount({
              token,
              value: initialAmount
            }).toFormat(4)}</span>
          </span>}
          <span>
            <span className='market-stats-amount-label'>Min. Amount</span>
            <span>{toUnitAmount({
              token,
              value: minAmount
            }).toFormat(4)}</span>
          </span>
        </div>

        <div className='market-stats-line-item'>
          <span className='market-stats-amount-label'>Balance</span>
          <span>{balance
            ? toUnitAmount({ token, value: balance }).toFormat(4)
            : '---'
          }</span>
        </div>

        {open && <div className='market-stats-line-item'>
          <span className='market-stats-amount-label'>Open</span>
          <span>{open.value
            ? toUnitAmount({ token, value: open.value }).toFormat(4)
            : '---'
          }</span>
        </div>}
      </div>
    );
  }

  private async startPolling() {
    this.interval = setInterval(this.load, 5000);
    await this.load();
  }

  private readonly load = async () => {
    this.marketStats = await new Dashboard.Api.MarketsService().getLatestStats({
      marketId: this.props.market._id
    });
  }
}
