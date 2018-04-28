import { parityAccountRepository } from '../db/parity-account-repository';
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
