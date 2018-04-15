import { observer } from 'mobx-react';
import * as React from 'react';
import './scrollable-grid.scss';

interface IScrollableGridProps<T> {
  columns: IScrollableGridColumn<T>[];
  models: T[];
  width?: string;
  className?: string;
  hideHeader?: boolean;
  style?: React.CSSProperties;
  initialScrollPosition?: 'top' | 'bottom';
  headerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  onRowClick?: (value: T) => void;
  emptyPlaceholder?: React.ReactNode;
  rowContent?: (value: T) => React.ReactNode;
}

export interface IScrollableGridColumn<T> {
  header: string | JSX.Element;
  getElement: (model: T) => JSX.Element;
  widthPoints: number;
  cellStyle?: React.CSSProperties;
}

@observer
export class ScrollableGrid<T> extends React.Component<IScrollableGridProps<T>> {

  public render() {
    const totalPoints = this.props.columns.map(c => c.widthPoints).reduce((a, b) => a + b);

    const style = this.props.style || {};
    style.width = this.props.width;

    return (
      <div className={`scrollable-grid ${this.props.className || ''}`} style={style}>
        {!this.props.hideHeader && <div className='header' style={this.props.headerStyle}>
          <div className='row'>
            {
              this.props.columns.map((column, i) => {
                const widthPercentage = `${(column.widthPoints / totalPoints) * 100}%`;

                return (
                  <div className='cell' key={i} style={{ width: widthPercentage }}>{column.header}</div>
                );
              })
            }
          </div>
        </div>}
        <div className='body' ref={this.setBodyRef} style={this.props.bodyStyle}>
          {this.props.models.map((m, i) => {
            return (
              <div className={`row ${this.props.onRowClick ? 'is-selectable' : ''}`}
                key={i} onClick={this.onRowClick(m)}>
                {this.props.columns.map((column, columnIndex) => {
                  const widthPercentage = `${(column.widthPoints / totalPoints) * 100}%`;

                  return (
                    <div className='cell fl vc' key={columnIndex} style={{ width: widthPercentage, ...column.cellStyle }}>{column.getElement(m)}</div>
                  );
                })}
                {this.props.rowContent && this.props.rowContent(m)}
              </div>
            );
          })}
          {this.props.emptyPlaceholder && this.props.models.length === 0 && <div className='h-padding'>
            {this.props.emptyPlaceholder}
          </div>}
        </div>
      </div>
    );
  }

  private readonly onRowClick = (value: T) => () => {
    if (this.props.onRowClick) {
      this.props.onRowClick(value);
    }
  }

  private readonly setBodyRef = (div: HTMLDivElement) => {
    if (div && this.props.initialScrollPosition === 'bottom') {
      div.scrollTop = div.scrollHeight - div.clientHeight;
    }
  }
}
