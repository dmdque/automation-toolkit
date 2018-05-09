import * as React from 'react';

interface ITextInputProps {
  label?: React.ReactNode;
  errorMessage?: React.ReactNode;
  infoMessage?: React.ReactNode;
}

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export class TextInput extends React.Component<ITextInputProps & InputProps> {
  public render() {
    return (
      <div className='text-input'>
        {this.props.label && <label>{this.props.label}</label>}
        <input {...this.props} />
        {this.props.errorMessage && <span className='error-message'>{this.props.errorMessage}</span>}
        {this.props.infoMessage && <span className='info-message'>{this.props.infoMessage}</span>}
      </div>
    );
  }
}
