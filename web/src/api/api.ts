/* tslint:disable */
import { ApiService, IRequestParams } from 'swagger/api-service';

export namespace Dashboard {
  let baseApiUrl: string;

  export const Initialize = (params: { host: string; }) => {
    baseApiUrl = `http://${params.host}`;
  };

  /**
   * Namespace representing REST API for ERC dEX
   */
  export namespace Api {

    export interface IImportAccountRequest {
      passphrase: string;
      key: string;
    }

    export interface IStoredBand {
      marketId: string;
      units: number;
      minUnits: number;
      spreadBps: number;
      toleranceBps: number;
      expirationSeconds: number;
      side: string;
      _id: string;
    }

    export interface IBand {
      marketId: string;
      units: number;
      minUnits: number;
      spreadBps: number;
      toleranceBps: number;
      expirationSeconds: number;
      side: string;
    }

    export interface IValidateRemoveResult {
      hasActiveOrders: boolean;
    }

    export interface IRemoveBandRequest {
      bandId: string;
      immediateCancelation: boolean;
    }

    export interface IStoredLog {
      dateCreated: Date;
      message: string;
      type: string;
      severity: string;
      _id: string;
    }

    export interface IStoredMarket {
      label: string;
      baseTokenSymbol: string;
      initialBaseAmount: string;
      minBaseAmount: string;
      quoteTokenSymbol: string;
      initialQuoteAmount: string;
      minQuoteAmount: string;
      minEthAmount: string;
      active?: boolean;
      _id: string;
    }

    export interface IMarket {
      label: string;
      baseTokenSymbol: string;
      initialBaseAmount: string;
      minBaseAmount: string;
      quoteTokenSymbol: string;
      initialQuoteAmount: string;
      minQuoteAmount: string;
      minEthAmount: string;
      active?: boolean;
    }

    export interface IStartMarketRequest {
      marketId: string;
      passphrase: string;
    }

    export interface IValidateStopResult {
      hasActiveBands: boolean;
    }

    export interface IStopMarketRequest {
      marketId: string;
      immediateCancelation: boolean;
    }

    export interface IMarketStats {
      baseBalance: string;
      baseUsdBalance: string;
      quoteBalance: string;
      quoteUsdBalance: string;
      ethBalance: string;
      ethUsdBalance: string;
      openBaseAmount: string;
      openQuoteAmount: string;
    }

    export interface IMarketStatsHistory {
      baseBalance: string;
      baseUsdBalance: string;
      quoteBalance: string;
      quoteUsdBalance: string;
      ethBalance: string;
      ethUsdBalance: string;
      openBaseAmount: string;
      openQuoteAmount: string;
      dateCreated: Date;
      marketId: string;
    }

    export interface IToken {
      name: string;
      address: string;
      symbol: string;
      decimals: number;
    }

    export interface ITokenPair {
      tokenA: IToken;
      tokenB: IToken;
      minimumQuantity: string;
      priceDecimals: number;
      baseVolume: string;
      quoteVolume: string;
    }


    export interface IAccountsImportAccountParams {
      request: IImportAccountRequest;
    }

    export interface IAccountsGetTokenBalanceParams {
      tokenAddress: string;
    }

    export interface IBandsGetParams {
      marketId: string;
    }

    export interface IBandsCreateBandParams {
      request: IBand;
    }

    export interface IBandsValidateRemoveBandParams {
      bandId: string;
    }

    export interface IBandsRemoveBandParams {
      request: IRemoveBandRequest;
    }

    export interface ILogsGetMarketParams {
      marketId: string;
    }

    export interface ILogsGetBandParams {
      bandId: string;
    }

    export interface IMarketsCreateParams {
      request: IMarket;
    }

    export interface IMarketsDeleteMarketParams {
      marketId: string;
    }

    export interface IMarketsStartMarketParams {
      request: IStartMarketRequest;
    }

    export interface IMarketsValidateStopParams {
      id: string;
    }

    export interface IMarketsStopMarketParams {
      request: IStopMarketRequest;
    }

    export interface IMarketsGetLatestStatsParams {
      marketId: string;
    }

    export interface IMarketsGetStatsParams {
      marketId: string;
    }
    export class AccountsService extends ApiService {

      public async getAccount() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/accounts`
        };
        return this.executeRequest<string>(requestParams);
      }

      public async importAccount(params: IAccountsImportAccountParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/accounts/import`
        };

        requestParams.body = params.request;
        return this.executeRequest<void>(requestParams);
      }

      public async getTokenBalance(params: IAccountsGetTokenBalanceParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/accounts/get_token_balance`
        };

        requestParams.queryParameters = {
          tokenAddress: params.tokenAddress,
        };
        return this.executeRequest<string>(requestParams);
      }

      public async getEthBalance() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/accounts/get_eth_balance`
        };
        return this.executeRequest<string>(requestParams);
      }
    }
    export class BandsService extends ApiService {

      public async get(params: IBandsGetParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/bands`
        };

        requestParams.queryParameters = {
          marketId: params.marketId,
        };
        return this.executeRequest<IStoredBand[]>(requestParams);
      }

      public async createBand(params: IBandsCreateBandParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/bands`
        };

        requestParams.body = params.request;
        return this.executeRequest<IStoredBand>(requestParams);
      }

      public async validateRemoveBand(params: IBandsValidateRemoveBandParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/bands/validate-remove/${params.bandId}`
        };
        return this.executeRequest<IValidateRemoveResult>(requestParams);
      }

      public async removeBand(params: IBandsRemoveBandParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/bands/remove`
        };

        requestParams.body = params.request;
        return this.executeRequest<void>(requestParams);
      }
    }
    export class LogsService extends ApiService {

      public async getMarket(params: ILogsGetMarketParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/logs/market/${params.marketId}`
        };
        return this.executeRequest<IStoredLog[]>(requestParams);
      }

      public async getBand(params: ILogsGetBandParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/logs/band/${params.bandId}`
        };
        return this.executeRequest<IStoredLog[]>(requestParams);
      }
    }
    export class MarketsService extends ApiService {

      public async get() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/markets`
        };
        return this.executeRequest<IStoredMarket[]>(requestParams);
      }

      public async create(params: IMarketsCreateParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets`
        };

        requestParams.body = params.request;
        return this.executeRequest<IStoredMarket>(requestParams);
      }

      public async deleteMarket(params: IMarketsDeleteMarketParams) {
        const requestParams: IRequestParams = {
          method: 'DELETE',
          url: `${baseApiUrl}/api/markets/${params.marketId}`
        };
        return this.executeRequest<void>(requestParams);
      }

      public async startMarket(params: IMarketsStartMarketParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets/start`
        };

        requestParams.body = params.request;
        return this.executeRequest<IStoredMarket>(requestParams);
      }

      public async validateStop(params: IMarketsValidateStopParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets/attempt_stop/${params.id}`
        };
        return this.executeRequest<IValidateStopResult>(requestParams);
      }

      public async stopMarket(params: IMarketsStopMarketParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets/stop`
        };

        requestParams.body = params.request;
        return this.executeRequest<any>(requestParams);
      }

      public async getNetworkId() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/markets/network_id`
        };
        return this.executeRequest<number>(requestParams);
      }

      public async getLatestStats(params: IMarketsGetLatestStatsParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/markets/latest_stats/${params.marketId}`
        };
        return this.executeRequest<IMarketStats>(requestParams);
      }

      public async getStats(params: IMarketsGetStatsParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/markets/stats/${params.marketId}`
        };
        return this.executeRequest<IMarketStatsHistory[]>(requestParams);
      }
    }
    export class TokenPairsService extends ApiService {

      public async get() {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/token-pairs`
        };
        return this.executeRequest<ITokenPair[]>(requestParams);
      }
    }
  }
}
