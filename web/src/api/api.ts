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

    export interface IStoredBand {
      marketId: string;
      ratio: number;
      spread: number;
      expirationSeconds: number;
      side: string;
      _id: string;
    }

    export interface IBand {
      marketId: string;
      ratio: number;
      spread: number;
      expirationSeconds: number;
      side: string;
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
      account: string;
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
      account: string;
      minEthAmount: string;
      active?: boolean;
    }

    export interface IStopMarketRequest {
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


    export interface IBandsGetParams {
      marketId: string;
    }

    export interface IBandsCreateBandParams {
      request: IBand;
    }

    export interface ILogsGetParams {
      marketId: string;
    }

    export interface IMarketsCreateParams {
      request: IMarket;
    }

    export interface IMarketsStartMarketParams {
      id: string;
    }

    export interface IMarketsStopMarketParams {
      request: IStopMarketRequest;
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
    }
    export class LogsService extends ApiService {

      public async get(params: ILogsGetParams) {
        const requestParams: IRequestParams = {
          method: 'GET',
          url: `${baseApiUrl}/api/logs/${params.marketId}`
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

      public async startMarket(params: IMarketsStartMarketParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets/start/${params.id}`
        };
        return this.executeRequest<IStoredMarket>(requestParams);
      }

      public async stopMarket(params: IMarketsStopMarketParams) {
        const requestParams: IRequestParams = {
          method: 'POST',
          url: `${baseApiUrl}/api/markets/stop`
        };

        requestParams.body = params.request;
        return this.executeRequest<any>(requestParams);
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
