import * as React from 'react';
import './nav-bar.scss';

interface INavBarProps {
}

export class NavBar extends React.Component<INavBarProps> {
  public render() {
    return (
      <div className='nav-bar'>
        <div className='fl vc'>
          <img src='/images/logo_dark.svg' className='logo' />
          <div className='header'>Market Maker</div>
        </div>
      </div>
    );
  }
}
