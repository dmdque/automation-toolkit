import * as React from 'react';
import { Modal } from './modal';

export interface IConfirmModalProps {
  title: string;
  submitText: string;
  onSubmit: () => Promise<void>;
  onClose: () => void;
  onError: (err: any) => void;
}

export class ConfirmModal extends React.Component<IConfirmModalProps> {
  public render() {
    return (
      <Modal title={this.props.title} onClose={this.props.onClose}>
        <form onSubmit={this.onSubmit} className='form'>
          {this.props.children}
          <div>
            <button type='submit' className='button primary fw'>
              {this.props.submitText}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  private readonly onSubmit: React.ChangeEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();

    try {
      await this.props.onSubmit();
      this.props.onClose();
    } catch (err) {
      this.props.onError(err);
    }
  }
}
