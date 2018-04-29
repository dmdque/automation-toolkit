import { IStoredParityAccount, parityAccountRepository } from '../db/parity-account-repository';
import { ServerError } from '../errors/server-error';
import { AqueductRemote } from '../swagger/aqueduct-remote';

export interface IUnlockAccountRequest {
  account: string;
  passphrase: string;
}

export class ParityAccountService {
  constructor(
    private readonly walletService: AqueductRemote.Api.IWalletService = new AqueductRemote.Api.WalletService()
  ) { }

  public async getAccounts(): Promise<IStoredParityAccount[]> {
    const storedAccounts = await parityAccountRepository.find({});
    if (storedAccounts.length > 0) {
      return storedAccounts;
    }

    const accounts = await this.walletService.getAccounts();
    for (let account of accounts) {
      const existingAccount = await parityAccountRepository.findOne({ account });
      if (existingAccount) {
        continue;
      }

      await parityAccountRepository.create({
        account,
        locked: true
      });
    }

    return await parityAccountRepository.find({});
  }

  public async unlockAccount({ account, passphrase }: IUnlockAccountRequest) {
    const existingAccount = await parityAccountRepository.findOne({ account });
    if (!existingAccount) {
      throw new ServerError(`account ${account} doesn't exist`, 404);
    }

    try {
      await this.walletService.unlockAccount({ request: { account, passphrase } });
    } catch (err) {
      throw new ServerError(err.message);
    }

    existingAccount.locked = false;
    await parityAccountRepository.update({ _id: existingAccount._id }, existingAccount);
  }
}
