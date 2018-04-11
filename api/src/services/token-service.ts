import { BigNumber } from 'bignumber.js';
import { Web3EnabledService } from './web3-enabled-service';

export class TokenService extends Web3EnabledService {
  public async getTokenBalance(params: { account: string; tokenAddress: string; }): Promise<BigNumber> {
    return await this.zeroEx.token.getBalanceAsync(params.tokenAddress, params.account);
  }
}
