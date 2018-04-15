/* tslint:disable */
import { ApiService, IRequestParams } from 'swagger/api-service';

export namespace AqueductRemote {
  let baseApiUrl: string;

  export const Initialize = (params: { host: string; }) => {
    baseApiUrl = `http://${params.host}`;
  };

  /**
   * Namespace representing REST API for ERC dEX
   */
  export namespace Api {

    export interface INodeHealth {
      success?: boolean;
      error?: string;
    }


    export interface IWalletGetBalanceParams {
      tokenAddress: string;
      account: string;
    }

    export interface IWalletGetEthBalanceParams {
      account: string;
    }
    export class WalletService extends ApiService {

      public async getAccounts() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/accounts`
        };
        return this.executeRequest<any>(requestParams);
      }

      public async getBalance(params: IWalletGetBalanceParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/balance`
        };

        requestParams.queryParameters = {
          tokenAddress: params.tokenAddress,
          account: params.account,
        };
        return this.executeRequest<string>(requestParams);
      }

      public async getEthBalance(params: IWalletGetEthBalanceParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/eth_balance`
        };

        requestParams.queryParameters = {
          account: params.account,
        };
        return this.executeRequest<any>(requestParams);
      }

      public async getNodeHealth() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/node_health`
        };
        return this.executeRequest<INodeHealth>(requestParams);
      }
    }
  }
}
