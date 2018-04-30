import { Dashboard } from 'api/api';
import { Form } from 'common/form/form';
import { TextInput } from 'common/form/text-input';
import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { accountStore } from 'stores/account-store';
import { flashMessageStore } from './flash-message/flash-message-store';

interface INoAccountsModalProps {
}

@observer
export class NoAccountModal extends React.Component<INoAccountsModalProps> {
  @observable private privateKey = '';
  @observable private passphrase = '';
  @observable private confirmPassphrase = '';

  public render() {
    const noOp = () => undefined;

    return (
      <Modal title='Wallet Setup' onClose={noOp}>
        <p className='h-padding'>
          <strong>Note:</strong> your private key will only be used locally and will <strong>not</strong> be stored in plain text.
          Your account information will be securely stored in a local, private Parity node.
        </p>
        <Form onSubmit={this.onSubmit}>
          <TextInput type='password' label='Private Key' placeholder='Private Key' autoFocus={true}
            onChange={this.onPrivateKeyChange} value={this.privateKey} required={true} />

          <TextInput type='password' label='Passphrase' placeholder='Passphrase' minLength={6}
            onChange={this.onPassphraseChange} value={this.passphrase} required={true} />

          <TextInput type='password' label='Confirm Passphrase' placeholder='Confirm Passphrase' minLength={6}
            onChange={this.onConfirmPassphraseChange} value={this.confirmPassphrase} required={true}
            errorMessage={this.confirmPassphraseError()} />

          <div>
            <button className='button primary fw' type='submit' disabled={!this.isValid()}>Submit</button>
          </div>
        </Form>
      </Modal>
    );
  }

  private readonly onPrivateKeyChange: React.ChangeEventHandler<HTMLInputElement> = event => this.privateKey = event.target.value;
  private readonly onPassphraseChange: React.ChangeEventHandler<HTMLInputElement> = event => this.passphrase = event.target.value;
  private readonly onConfirmPassphraseChange: React.ChangeEventHandler<HTMLInputElement> = event => this.confirmPassphrase = event.target.value;

  private isValid() {
    return this.privateKey && this.passphrase && this.confirmPassphrase && this.passphrase === this.confirmPassphrase;
  }

  private confirmPassphraseError() {
    if (this.passphrase && this.confirmPassphrase && this.passphrase !== this.confirmPassphrase) {
      return 'Passphrases must match';
    }

    return;
  }

  private readonly onSubmit = async () => {
    if (!this.isValid()) {
      return;
    }

    try {
      await new Dashboard.Api.AccountsService().importAccount({
        request: {
          key: this.privateKey,
          passphrase: this.passphrase
        }
      });
      await accountStore.initialize();
    } catch (err) {
      flashMessageStore.addMessage(err.message);
    }
  }
}
