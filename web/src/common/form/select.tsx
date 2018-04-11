import * as React from 'react';

interface ISelectProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
  label: string;
}

export class Select extends React.Component<ISelectProps> {
  public render() {
    return (
      <div className='select-container'>
        <label>{this.props.label}</label>
        <select {...this.props}>
          {this.props.children}
        </select>
      </div>
    );
  }
}
