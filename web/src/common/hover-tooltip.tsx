import * as classNames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import './hover-tooltip.scss';

interface IHoverTooltipProps {
  children?: JSX.Element | string;
  tooltipContent: React.ReactNode;
  width?: string;
  verticalAlign?: 'top' | 'bottom';
  horizontalAlign?: 'right' | 'left';
  hide?: boolean;
  className?: string;
}

@observer
export class HoverTooltip extends React.Component<IHoverTooltipProps> {
  @observable private isActive = false;

  public render() {
    const vAlign = this.props.verticalAlign || 'bottom';
    const hAlign = this.props.horizontalAlign || 'right';

    return (
      <span onMouseEnter={this.onMouseEnter} onClick={this.toggleActive}
        onMouseLeave={this.onMouseLeave} className={classNames('hover-tooltip', 'no-select', this.props.className)}>
        {this.props.children || <i className='fa fa-question-circle' />}
        {this.isActive && !this.props.hide && <div className={`tooltip-content ${vAlign} ${hAlign} popup-menu ${this.props.width ? 'fixed' : ''}`}
          style={{ width: this.props.width }}>
          {this.props.tooltipContent}
        </div>}
      </span>
    );
  }

  private readonly toggleActive = () => this.isActive = !this.isActive;

  private readonly onMouseEnter = () => {
    this.isActive = true;
  }

  private readonly onMouseLeave = () => {
    this.isActive = false;
  }
}
