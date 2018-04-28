import { parityAccountRepository } from '../db/parity-account-repository';
import { AqueductRemote } from '../swagger/aqueduct-remote';

const sleep = (ms: number) => {
  return new Promise(r => setTimeout(() => r(), ms));
};

export class PendingAqueductService {
  constructor(
    private readonly walletService: AqueductRemote.Api.IWalletService = new AqueductRemote.Api.WalletService()
  ) { }

  public async waitForAqueductRemote() {
    while (true) {
      try {
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

        console.log('aqueduct remote ready');
        return;
      } catch {
        console.error('waiting for aqueduct remote to start...');
        await sleep(5000);
      }
    }
  }
}
