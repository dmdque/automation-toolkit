import * as React from 'react';
import './nav-bar.scss';

interface INavBarProps {
}

export class NavBar extends React.Component<INavBarProps> {
  public render() {
    return (
      <div className='nav-bar'>
        <div className='header'>Market Maker Dashboard</div>
      </div>
    );
  }
}
