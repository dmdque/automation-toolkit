import { Dashboard } from 'api/api';
import { Form } from 'common/form/form';
import { Select } from 'common/form/select';
import { TextInput } from 'common/form/text-input';
import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { accountStore } from 'stores/account-store';
import { flashMessageStore } from './flash-message/flash-message-store';

interface IUnlockAccountsModalProps {
}

@observer
export class UnlockAccountsModal extends React.Component<IUnlockAccountsModalProps> {
  @observable private selectedAccount?: string;
  @observable private passphrase = '';

  public render() {
    const noop = () => undefined;

    const lockedAccounts = accountStore.accounts.filter(a => a.locked);
    return (
      <Modal title='Unlock Accounts' onClose={noop}>
        <Form onSubmit={this.onSubmit}>
          <p>No parity accounts are unlocked</p>
          <Select label='Service Account' onChange={this.onAccountChange} required={true}>
            <option value='' selected={true} disabled={true} hidden={true}>Select Account to Unlock</option>
            {lockedAccounts.map(a => (
              <option key={a.account} value={a.account}>{a.account}</option>
            ))}
          </Select>
          {this.selectedAccount && <div>
            <TextInput label='Passphrase' placeholder='Passphrase' autoFocus={true} required={true}
              value={this.passphrase} onChange={this.onPassphraseChange} type='password' />
          </div>}
          <div>
            <button className='button primary fw' type='submit' disabled={!this.isValid()}>Unlock Selected Account</button>
          </div>
        </Form>
      </Modal>
    );
  }

  private onAccountChange: React.ChangeEventHandler<HTMLSelectElement> = event => {
    this.selectedAccount = event.target.value;
  }

  private readonly onPassphraseChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.passphrase = event.target.value;
  }

  private isValid() {
    return !!(this.selectedAccount && this.passphrase);
  }

  private readonly onSubmit = async () => {
    if (!this.isValid()) {
      return;
    }

    try {
      await new Dashboard.Api.AccountsService().unlockAccount({
        request: {
          account: this.selectedAccount as string,
          passphrase: this.passphrase
        }
      });
      await accountStore.initialize();
    } catch (err) {
      flashMessageStore.addMessage({
        type: 'error',
        content: err.message
      });
    }
  }
}
