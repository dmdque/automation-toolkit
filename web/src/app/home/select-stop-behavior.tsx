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
  @observable private softCancelation = false;

  public render() {
    return (
      <Modal title='Choose Market Stop Behavior' onClose={this.props.onClose}>
        <form className='form' onSubmit={this.onSubmit}>
          <p>{this.props.message}</p>
          <label>
            <input type='radio' name='mode' value='allow-expiration' checked={!this.softCancelation} onChange={this.onSelectionChange} />
            Soft Cancel Order(s) (no gas costs, removes from order book, can possibly get filled off-platform)
        </label>
          <label>
            <input type='radio' name='mode' value='cancel-immediately' checked={this.softCancelation} onChange={this.onSelectionChange} />
            Cancel Order(s) Immediately (will incur gas costs, on-chain cancelation, guaranteed unfillable once transaction completes)
        </label>
          <div className='fl fe t-margin'>
            <button className='button primary fw'>{this.props.submitText}</button>
          </div>
        </form>
      </Modal>
    );
  }

  private readonly onSelectionChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.softCancelation = event.target.value === 'cancel-immediately';
  }

  private readonly onSubmit: React.ChangeEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    this.props.onSelect(this.softCancelation);
    this.props.onClose();
  }
}
