import { Dashboard } from 'api/api';
import { getPath } from 'common/paths';
import { History } from 'history';
import { autorun, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { marketStore } from 'stores/market-store';
import { CreateMarket } from './create-market';
import './select-market.scss';

interface ISelectMarketProps {
  history?: History;
}

@withRouter
@observer
export class SelectMarket extends React.Component<ISelectMarketProps> {
  @observable private isCreatingMarket = false;

  constructor(public readonly props: ISelectMarketProps) {
    super(props);
    autorun(() => {
      this.isCreatingMarket = marketStore.markets.length === 0;
    });
  }

  public render() {
    const markets = marketStore.markets;
    return (
      <div className='select-market fl co'>
        <div className='header fl sb vc'>
          Markets
          <div className='oval add-icon' onClick={this.onClickCreate}>
            <img src='/images/add.svg' alt='Create New Market' title='Create New Market' />
          </div>
        </div>
        <div className='market-list grow'>
          {!markets.length && <p className='ta-c'>---</p>}
          {markets.length > 0 && markets.map(m => {
            const path = getPath(p => p.home.market, { id: m._id });
            return (
              <NavLink key={m._id} to={path} className='market-list-item' activeClassName='active'>
                <div className='market-list-item-label'>{m.label}</div>
                <div className='market-list-item-sub-label'>{m.baseTokenSymbol}/{m.quoteTokenSymbol}</div>
              </NavLink>
            );
          })}
        </div>
        {this.isCreatingMarket && <CreateMarket onClose={this.onClose} onSuccess={this.onCreateSuccess} />}
      </div>
    );
  }

  private readonly onCreateSuccess = async (market: Dashboard.Api.IStoredMarket) => {
    await marketStore.initialize();
    (this.props.history as History).push(getPath(p => p.home.market, { id: market._id }));
  }

  private readonly onClickCreate = () => this.isCreatingMarket = true;
  private readonly onClose = () => this.isCreatingMarket = false;
}
