import { Body, Get, Post, Route, Tags } from 'tsoa';
import { IStoredParityAccount } from '../db/parity-account-repository';
import { IUnlockAccountRequest, ParityAccountService } from '../services/parity-account-service';

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
}
