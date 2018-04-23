import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

export interface ISelectStopBehaviorProps {
  message: string;
  submitText: string;
  onClose: () => void;
  onSelect: (immediateCancelation: boolean) => void;
}

@observer
export class SelectStopBehavior extends React.Component<ISelectStopBehaviorProps> {
  @observable private immediateCancelation = false;

  public render() {
    return (
      <Modal title='Choose Market Stop Behavior' onClose={this.props.onClose}>
        <form className='form' onSubmit={this.onSubmit}>
          <p>{this.props.message}</p>
          <label>
            <input type='radio' name='mode' value='allow-expiration' checked={!this.immediateCancelation} onChange={this.onSelectionChange} />
            Allow Order(s) to Expire
        </label>
          <label>
            <input type='radio' name='mode' value='cancel-immediately' checked={this.immediateCancelation} onChange={this.onSelectionChange} />
            Cancel Order(s) Immediately (will incur gas costs)
        </label>
          <div className='fl fe t-margin'>
            <button className='button primary fw'>{this.props.submitText}</button>
          </div>
        </form>
      </Modal>
    );
  }

  private readonly onSelectionChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.immediateCancelation = event.target.value === 'cancel-immediately';
  }

  private readonly onSubmit: React.ChangeEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    this.props.onSelect(this.immediateCancelation);
    this.props.onClose();
  }
}
