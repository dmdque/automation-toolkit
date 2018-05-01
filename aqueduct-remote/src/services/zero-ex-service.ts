import { ZeroEx } from '0x.js';
import { config } from '../config';
import { ServerError } from '../server-error';
import { Web3Service } from './web3-service';

export interface ICancelReceipt {
  gasUsed: number;
  cumulativeGasUsed: number;
  status: number;
}

export class ZeroExService {
  private readonly zeroEx: ZeroEx;

  constructor() {
    const web3 = new Web3Service().getWeb3();
    this.zeroEx = new ZeroEx(web3.currentProvider, {
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
      return await this.zeroEx.awaitTransactionMinedAsync(txHash, 5000) as ICancelReceipt;
    } catch (err) {
      throw new ServerError(`cancel ${txHash} not yet mined`);
    }
  }
}
