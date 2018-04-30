import { Body, Get, Post, Query, Route, Tags } from 'tsoa';
import { AqueductRemote } from '../swagger/aqueduct-remote';

export interface IImportAccountRequest {
  passphrase: string;
  key: string;
}

@Route('accounts')
export class AccountsController {
  @Get()
  @Tags('Accounts')
  public async getAccount(): Promise<string> {
    return await new AqueductRemote.Api.WalletService().getAccount();
  }

  @Post('import')
  @Tags('Accounts')
  public async importAccount(@Body() request: IImportAccountRequest) {
    await new AqueductRemote.Api.WalletService().importAccount({ request });
  }

  @Get('get_token_balance')
  @Tags('Accounts')
  public async getTokenBalance(@Query() tokenAddress: string): Promise<string> {
    return await new AqueductRemote.Api.WalletService().getBalance({ tokenAddress });
  }

  @Get('get_eth_balance')
  @Tags('Accounts')
  public async getEthBalance(): Promise<string> {
    return await new AqueductRemote.Api.WalletService().getEthBalance();
  }
}
