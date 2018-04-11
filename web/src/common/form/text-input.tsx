import * as React from 'react';

interface ITextInputProps {
  label: string;
}

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export class TextInput extends React.Component<ITextInputProps & InputProps> {
  public render() {
    return (
      <div className='text-input'>
        <label>{this.props.label}</label>
        <input {...this.props} />
      </div>
    );
  }
}
