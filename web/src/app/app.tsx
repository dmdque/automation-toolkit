import { getPath } from 'common/paths';
import * as React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router';
import './app.scss';
import { FlashMessage } from './flash-message/flash-message';
import { Home } from './home/home';
import { NavBar } from './nav-bar/nav-bar';

interface IAppProps {
}

@withRouter
export class App extends React.Component<IAppProps> {
  public render() {
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
}
