import { LoadingScreen } from 'common/loading-screen';
import { getPath } from 'common/paths';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { accountStore } from 'stores/account-store';
import { NoAccountsModal } from '../no-accounts-modal';
import { UnlockAccountsModal } from '../unlock-accounts-modal';
import { MarketView } from './market-view';
import { SelectMarket } from './select-market';

interface IHomeProps {
}

@observer
export class Home extends React.Component<IHomeProps> {
  public render() {
    if (!accountStore.accounts) {
      return <LoadingScreen />;
    }

    if (!accountStore.accounts.length) {
      return <NoAccountsModal />;
    }

    const noUnlockedAccounts = accountStore.accounts.find(a => a.locked);
    if (noUnlockedAccounts) {
      return <UnlockAccountsModal />;
    }

    return (
      <div className='fl fh'>
        <SelectMarket />
        <Route path={getPath(p => p.home.market)} component={MarketView} />
      </div>
    );
  }
}
