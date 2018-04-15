import { AqueductRemote } from 'api/aqueduct-remote';

export class AccountStore {
  public accounts: string[];

  public async initialize() {
    this.accounts = await new AqueductRemote.Api.WalletService().getAccounts();
  }
}

export const accountStore = new AccountStore();
