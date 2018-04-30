import { Body, Get, Post, Query, Route, Tags } from 'tsoa';
import { config } from '../config';
import { INodeHealth, IUnlockAccountParams, Web3Service } from '../services/web3-service';
import { ZeroExService } from '../services/zero-ex-service';

@Route('wallet')
export class WalletController {
  @Get('accounts')
  @Tags('Wallet')
  public async getAccounts(): Promise<string[]> {
    return await new Web3Service().getAccounts();
  }

  @Get('balance')
  @Tags('Wallet')
  public async getBalance(@Query() tokenAddress: string, @Query() account: string): Promise<string> {
    return await new ZeroExService().getTokenBalance(account, tokenAddress);
  }

  @Get('eth_balance')
  @Tags('Wallet')
  public async getEthBalance(@Query() account: string): Promise<string> {
    return await new Web3Service().getEthBalance(account);
  }

  @Get('node_health')
  @Tags('Wallet')
  public async getNodeHealth(): Promise<INodeHealth> {
    return await new Web3Service().getParityNodeHealth();
  }

  @Post('unlock_account')
  @Tags('Wallet')
  public async unlockAccount(@Body() request: IUnlockAccountParams): Promise<void> {
    await new Web3Service().unlockAccount(request);
  }

  @Get('network_id')
  @Tags('Wallet')
  public getNetworkId() {
    return config.networkId;
  }
}
