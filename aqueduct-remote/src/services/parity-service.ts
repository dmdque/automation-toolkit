import { ServerError } from '../server-error';
import { Web3Service } from './web3-service';

export interface IImportAccountRequest {
  key: string;
  passphrase: string;
}

export class ParityService {
  private readonly web3Service = new Web3Service();

  public async importAccount(request: IImportAccountRequest) {
    let account: string | undefined = undefined;
    try {
      account = await this.web3Service.getAccount();
    // tslint:disable-next-line:no-empty
    } catch { }

    if (account) {
      throw new ServerError(`cannot import account, another account already active. remove existing account first.`, 400);
    }

    const response = await this.newAccountFromSecret(request.key, request.passphrase);
    if (response.error) {
      throw new ServerError(`newAccountFromSecret: ${response.error.message}`);
    }

    const setResponse = await this.setAccountName(response.result);
    if (setResponse.error) {
      throw new ServerError(`setAccountName: ${setResponse.error.message}`);
    }

    await this.unlockAccount(response.result, request.passphrase);
  }

  public async unlockAccount(account: string, passphrase: string) {
    return new Promise((resolve, reject) => {
      (new Web3Service().getWeb3().personal as any).unlockAccount(account, passphrase, '0x0', (err: any) => {
        if (err) {
          console.error(err);
          reject(new ServerError('Could not unlock account - possibly incorrect passphrase.', 401));
          return;
        }

        resolve();
      });
    });
  }

  public async removeAccount(account: string, passphrase: string) {
    return await this.web3Service.executeRpcCommand('parity_killAccount', [
      account,
      passphrase
    ]);
  }

  private async newAccountFromSecret(key: string, passphrase: string) {
    return await this.web3Service.executeRpcCommand<{ result: string; error?: { message: string; } }>('parity_newAccountFromSecret', [
      `0x${key}`,
      passphrase
    ]);
  }

  private async setAccountName(account: string) {
    return await this.web3Service.executeRpcCommand<{ error?: { message: string }}>('parity_setAccountName', [
      account,
      'bot-service-account'
    ]);
  }
}
