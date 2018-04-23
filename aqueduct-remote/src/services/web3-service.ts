import * as request from 'request-promise-native';
import * as Web3 from 'web3';
import { config } from '../config';

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

      if (health.result.peers.status !== 'ok') {
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
