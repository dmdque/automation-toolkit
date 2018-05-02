import { ZeroEx } from '0x.js';
import { Transaction } from '@0xproject/types';
import { config } from '../config';
import { ServerError } from '../server-error';
import { Web3Service } from './web3-service';

export interface ICancelReceipt {
  gasCost: string;
  status: number;
}

export class ZeroExService {
  private readonly zeroEx: ZeroEx;
  private readonly web3 = new Web3Service().getWeb3();

  constructor() {
    this.zeroEx = new ZeroEx(this.web3.currentProvider, {
      networkId: config.networkId
    });
  }

  public async getTokenBalance(tokenAddress: string) {
    const account = await new Web3Service().getAccount();
    const balance = await this.zeroEx.token.getBalanceAsync(tokenAddress, account);
    return balance.toString();
  }

  public async getCancelReceipt(txHash: string): Promise<ICancelReceipt> {
    try {
      const receipt = await this.zeroEx.awaitTransactionMinedAsync(txHash, 5000);
      const tx = await this.getTx(txHash);

      return {
        gasCost: tx.gasPrice.times(tx.gas).toString(),
        status: receipt.status
      } as ICancelReceipt;
    } catch (err) {
      throw new ServerError(`cancel ${txHash} not yet mined`);
    }
  }

  private async getTx(txHash: string) {
    return new Promise<Transaction>((resolve, reject) => {
      this.web3.eth.getTransaction(txHash, (err, tx) => {
        if (err) { return reject(err); }
        resolve(tx);
      });
    });
  }
}
