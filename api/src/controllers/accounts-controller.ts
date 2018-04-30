import { Body, Get, Post, Query, Route, Tags } from 'tsoa';
import { IStoredParityAccount } from '../db/parity-account-repository';
import { IUnlockAccountRequest, ParityAccountService } from '../services/parity-account-service';
import { AqueductRemote } from '../swagger/aqueduct-remote';

@Route('accounts')
export class AccountsController {
  @Get()
  @Tags('Accounts')
  public async getAccounts(): Promise<IStoredParityAccount[]> {
    return await new ParityAccountService().getAccounts();
  }

  @Post('unlock_account')
  @Tags('Accounts')
  public async unlockAccount(@Body() request: IUnlockAccountRequest) {
    await new ParityAccountService().unlockAccount(request);
  }

  @Get('get_token_balance')
  @Tags('Accounts')
  public async getTokenBalance(@Query() account: string, @Query() tokenAddress: string): Promise<string> {
    return await new AqueductRemote.Api.WalletService().getBalance({ account, tokenAddress });
  }

  @Get('get_eth_balance')
  @Tags('Accounts')
  public async getEthBalance(@Query() account: string): Promise<string> {
    return await new AqueductRemote.Api.WalletService().getEthBalance({ account });
  }
}
