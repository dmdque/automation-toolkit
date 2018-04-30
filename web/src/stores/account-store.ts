import { Dashboard } from 'api/api';
import { observable } from 'mobx';

export class AccountStore {
  @observable public account?: string;

  public async initialize() {
    try {
      this.account = await new Dashboard.Api.AccountsService().getAccount();
    } catch { return; }
  }
}

export const accountStore = new AccountStore();
