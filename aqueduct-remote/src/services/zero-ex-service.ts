import { ZeroEx } from '0x.js';
import { config } from '../config';
import { Web3Service } from './web3-service';

export class ZeroExService {
  private readonly zeroEx: ZeroEx;

  constructor() {
    const web3 = new Web3Service().getWeb3();
    this.zeroEx = new ZeroEx(web3.currentProvider, {
      networkId: config.networkId
    });
  }

  public async getTokenBalance(account: string, tokenAddress: string) {
    const balance = await this.zeroEx.token.getBalanceAsync(tokenAddress, account);
    return balance.toString();
  }
}
