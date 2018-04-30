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
  passphrase: string;
}

export class Web3Service {
  private readonly web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  public async getAccount() {
    const accounts = await this.getAccounts();

    const account = accounts[0];
    if (!account) {
      throw new ServerError(`no account configured`);
    }

    return account;
  }

  public async getEthBalance() {
    const account = await this.getAccount();
    return await this._getEthBalance(account);
  }

  public getWeb3() {
    return this.web3;
  }

  public async getParityNodeHealth(): Promise<INodeHealth> {
    try {
      const health = await this.executeRpcCommand<IParityHealth>('parity_nodeHealth');
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

  public async executeRpcCommand<T>(method: string, params: any[] = []) {
    return await request({
      method: 'POST',
      uri: config.nodeUrl,
      body: {
        method,
        params,
        id: 1,
        jsonrpc: '2.0'
      },
      json: true,
      contentType: 'application/json'
    }) as T;
  }

  private async getAccounts() {
    return new Promise<string[]>((resolve, reject) => {
      this.web3.eth.getAccounts((err, accounts) => {
        if (err) { return reject(err); }
        resolve(accounts);
      });
    });
  }

  private async _getEthBalance(account: string) {
    return new Promise<string>((resolve, reject) => {
      this.web3.eth.getBalance(account, (err, balance) => {
        if (err) { return reject(err); }
        resolve(balance.toString());
      });
    });
  }
}
