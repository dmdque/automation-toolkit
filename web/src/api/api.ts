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

    export interface IStoredMarket {
      label: string;
      baseTokenSymbol: string;
      quoteTokenSymbol: string;
      _id: string;
    }

    export interface IMarket {
      label: string;
      baseTokenSymbol: string;
      quoteTokenSymbol: string;
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


    export interface IMarketsCreateParams {
      request: IMarket;
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
