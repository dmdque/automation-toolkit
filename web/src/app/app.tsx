import { AqueductRemote } from 'api/aqueduct-remote';
import { LoadingScreen } from 'common/loading-screen';
import { getPath } from 'common/paths';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router';
import './app.scss';
import { FlashMessage } from './flash-message/flash-message';
import { Home } from './home/home';
import { NavBar } from './nav-bar/nav-bar';

interface IAppProps {
}

@withRouter
@observer
export class App extends React.Component<IAppProps> {
  @observable private nodeHealth?: AqueductRemote.Api.INodeHealth;

  constructor() {
    super();
    this.load();
  }

  public render() {
    if (typeof this.nodeHealth === 'undefined') {
      return <LoadingScreen height='100%' message='Loading Parity Status' />;
    }

    if (this.nodeHealth.error) {
      return <LoadingScreen height='100%' message={this.nodeHealth.error} />;
    }

    return (
      <div className='app fl co'>
        <NavBar />
        <FlashMessage />
        <div className='app-content'>
          <Switch>
            <Route path={getPath(p => p.home)} component={Home} />
            <Redirect to={getPath(p => p.home)} />
          </Switch>
        </div>
      </div>
    );
  }

  private async load() {
    let timer: any;
    const loadNodeHealth = async () => {
      this.nodeHealth = await new AqueductRemote.Api.WalletService().getNodeHealth();
      if (this.nodeHealth.success && timer) {
        clearInterval(timer);
      }
    };

    timer = setInterval(loadNodeHealth, 10000);
    loadNodeHealth();
  }
}
