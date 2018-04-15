import * as React from 'react';

interface ITextInputProps {
  label?: string;
  errorMessage?: string;
}

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export class TextInput extends React.Component<ITextInputProps & InputProps> {
  public render() {
    return (
      <div className='text-input'>
        {this.props.label && <label>{this.props.label}</label>}
        <input {...this.props} />
        <span className='error-message'>{this.props.errorMessage}</span>
      </div>
    );
  }
}
