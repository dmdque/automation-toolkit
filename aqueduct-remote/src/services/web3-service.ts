import * as request from 'request-promise-native';
import * as Web3 from 'web3';
import { config } from '../config';
import { ServerError } from '../server-error';

interface IParityHealth {
  jsonrpc: string;
  result: {
    peers: {
      details: [number, number],
      message: string;
      status: string;
    }
    sync: {
      details: boolean;
      message: string;
      status: 'ok' | 'needsAttention';
    };
    time: {
      details: number;
      message: string;
      status: string;
    };
  };
  id: number;
}

export interface INodeHealth {
  success?: boolean;
  error?: string;
}

export interface IUnlockAccountParams {
  account: string;
  passphrase: string;
}

export class Web3Service {
  private readonly web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  public async getAccounts() {
    return new Promise<string[]>((resolve, reject) => {
      this.web3.eth.getAccounts((err, accounts) => {
        if (err) { return reject(err); }
        resolve(accounts);
      });
    });
  }

  public async getEthBalance(account: string) {
    return new Promise<string>((resolve, reject) => {
      this.web3.eth.getBalance(account, (err, balance) => {
        if (err) { return reject(err); }
        resolve(balance.toString());
      });
    });
  }

  public getWeb3() {
    return this.web3;
  }

  public async unlockAccount({ account, passphrase }: IUnlockAccountParams) {
    return new Promise((resolve, reject) => {
      (this.web3.personal as any).unlockAccount(account, passphrase, '0x0', (err: any) => {
        if (err) {
          console.error(err);
          reject(new ServerError('Could not unlock account - possibly incorrect passphrase.', 401));
          return;
        }

        resolve();
      });
    });
  }

  public async getParityNodeHealth(): Promise<INodeHealth> {
    try {
      const health: IParityHealth = await request({
        method: 'POST',
        uri: config.nodeUrl,
        body: {
          method: 'parity_nodeHealth',
          params: [],
          id: 1,
          jsonrpc: '2.0'
        },
        json: true,
        contentType: 'application/json'
      });

      if (health.result.peers.status !== 'ok'
        // we're going to say this is okay
        && health.result.peers.message !== 'You are connected to only one peer. Your node might not be reliable. Check your network connection.') {
        return {
          error: health.result.peers.message
        };
      }

      if (health.result.sync.status !== 'ok') {
        return {
          error: health.result.sync.message
        };
      }

      return {
        success: true
      };
    } catch (err) {
      console.error(err);
      return {
        error: 'Cannot connect to Parity node; please ensure that the node is running.'
      };
    }
  }
}
