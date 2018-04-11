import { ZeroEx } from '0x.js';
import * as Web3 from 'web3';

export abstract class Web3EnabledService {
  protected readonly web3: Web3;
  protected networkId: number;
  protected zeroEx: ZeroEx;

  constructor(nodeUrl: string, networkId: number) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
    this.zeroEx = new ZeroEx(this.web3.currentProvider, { networkId });
  }
}
