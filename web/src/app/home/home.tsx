import { getPath } from 'common/paths';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { MarketView } from './market-view';
import { SelectMarket } from './select-market';

interface IHomeProps {
}

export class Home extends React.Component<IHomeProps> {
  public render() {
    return (
      <div className='fl fh'>
        <SelectMarket />
        <Route path={getPath(p => p.home.market)} component={MarketView} />
      </div>
    );
  }
}
