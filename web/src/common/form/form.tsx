import * as React from 'react';
import './form.scss';

interface IFormProps {
  onSubmit?: () => void;
}

export class Form extends React.Component<IFormProps> {
  public render() {
    return (
      <form onSubmit={this.onSubmit} className='form'>
        {this.props.children}
      </form>
    );
  }

  private readonly onSubmit: React.ChangeEventHandler<HTMLFormElement> = event => {
    event.preventDefault();

    if (this.props.onSubmit) {
      this.props.onSubmit();
    }
  }
}
