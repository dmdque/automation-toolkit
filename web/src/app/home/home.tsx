import { getPath } from 'common/paths';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { accountStore } from 'stores/account-store';
import { NoAccountModal } from '../no-account-modal';
import { MarketView } from './market-view';
import { SelectMarket } from './select-market';

interface IHomeProps {
}

@observer
export class Home extends React.Component<IHomeProps> {
  public render() {
    if (!accountStore.account) {
      return <NoAccountModal />;
    }

    return (
      <div className='fl fh'>
        <SelectMarket />
        <Route path={getPath(p => p.home.market)} component={MarketView} />
      </div>
    );
  }
}
