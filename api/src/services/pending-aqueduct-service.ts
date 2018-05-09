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
        await this.walletService.getNetwork();
        console.log('aqueduct remote ready');
        return;
      } catch (err) {
        console.error('waiting for aqueduct remote to start...');
        await sleep(5000);
      }
    }
  }
}
