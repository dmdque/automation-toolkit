import { Dashboard } from 'api/api';
import { observable } from 'mobx';

export class AccountStore {
  @observable public accounts: Dashboard.Api.IStoredParityAccount[];

  public async initialize() {
    this.accounts = await new Dashboard.Api.AccountsService().get();
  }
}

export const accountStore = new AccountStore();
