/* tslint:disable */
import { ApiService, IRequestParams } from './api-service';

export namespace AqueductRemote {
  let baseApiUrl: string;

  export const Initialize = (params: { host: string; }) => {
    baseApiUrl = `http://${params.host}`;
  };

  /**
   * Namespace representing REST API for ERC dEX
   */
  export namespace Api {

    export interface IOrder {
      id: number;
      dateCreated: Date;
      dateUpdated: Date;
      dateClosed: Date;
      networkId: number;
      exchangeContractAddress: string;
      expirationUnixTimestampSec: number;
      feeRecipient: string;
      maker: string;
      makerFee: string;
      makerTokenAddress: string;
      makerTokenAmount: string;
      salt: string;
      serializedEcSignature: string;
      taker: string;
      takerFee: string;
      takerTokenAddress: string;
      takerTokenAmount: string;
      remainingTakerTokenAmount: string;
      orderHash: string;
      accountId?: number;
      state: number;
      source: string;
    }

    export interface ILimitOrderRequest {
      account: string;
      baseTokenSymbol: string;
      quoteTokenSymbol: string;
      expirationDate: Date;
      price: string;
      quantityInWei: string;
      side: string;
    }

    export interface INodeHealth {
      success?: boolean;
      error?: string;
    }

    export interface IUnlockAccountParams {
      account: string;
      passphrase: string;
    }


    export interface ITradingCreateLimitOrderParams {
      request: ILimitOrderRequest;
    }

    export interface ITradingCancelOrderParams {
      orderHash: string;
    }

    export interface IWalletGetBalanceParams {
      tokenAddress: string;
      account: string;
    }

    export interface IWalletGetEthBalanceParams {
      account: string;
    }

    export interface IWalletUnlockAccountParams {
      request: IUnlockAccountParams;
    }
    export interface ITradingService {
      createLimitOrder(params: ITradingCreateLimitOrderParams): Promise<IOrder>;
      cancelOrder(params: ITradingCancelOrderParams): Promise<string>;
    }

    export class TradingService extends ApiService implements ITradingService {

      public async createLimitOrder(params: ITradingCreateLimitOrderParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/trading/limit_order`
        };

        requestParams.body = params.request;
        return this.executeRequest<IOrder>(requestParams);
      }

      public async cancelOrder(params: ITradingCancelOrderParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/trading/cancel_order/${params.orderHash}`
        };
        return this.executeRequest<string>(requestParams);
      }
    }
    export interface IWalletService {
      getAccounts(): Promise<string[]>;
      getBalance(params: IWalletGetBalanceParams): Promise<string>;
      getEthBalance(params: IWalletGetEthBalanceParams): Promise<any>;
      getNodeHealth(): Promise<INodeHealth>;
      unlockAccount(params: IWalletUnlockAccountParams): Promise<void>;
      getNetworkId(): Promise<number>;
    }

    export class WalletService extends ApiService implements IWalletService {

      public async getAccounts() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/accounts`
        };
        return this.executeRequest<string[]>(requestParams);
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

      public async unlockAccount(params: IWalletUnlockAccountParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/wallet/unlock_account`
        };

        requestParams.body = params.request;
        return this.executeRequest<void>(requestParams);
      }

      public async getNetworkId() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/wallet/network_id`
        };
        return this.executeRequest<number>(requestParams);
      }
    }
  }
}
