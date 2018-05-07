import { BigNumber } from 'bignumber.js';
import * as request from 'request-promise-native';
import { config, GasPriceSetting } from '../config';

export interface IEthGasStationResponse {
  safelow_calc: number;
  average_calc: number;
  average: number;
  safelow_txpool: number;
  fastest: number;
  fast: number;
  average_txpool: number;
  block_time: number;
  speed: number;
  fastWait: number;
  safeLowWait: number;
  blockNum: number;
  fastestWait: number;
  safeLow: number;
  avgWait: number;
}

export interface IGasStationProvider {
  request: () => Promise<IEthGasStationResponse>;
}

export interface IGasService {
  getGasPrice(): Promise<BigNumber | undefined>;
}

const gasPriceValueMap: { [K in GasPriceSetting]: (r: IEthGasStationResponse) => number } = {
  fast: r => r.fast,
  safelow: r => r.safeLow,
  standard: r => r.average
};

export class GasService implements IGasService {
  private readonly provider: IGasStationProvider;

  constructor(provider?: IGasStationProvider) {
    this.provider = provider || {
      request: async () => {
        const resp: IEthGasStationResponse = await request({
          uri: 'https://ethgasstation.info/json/ethgasAPI.json',
          json: true
        });
        return resp;
      }
    };
  }

  public async getGasPrice(): Promise<BigNumber | undefined> {
    try {
      const result = await this.provider.request();
      const value = gasPriceValueMap[config.gasSetting](result);
      return new BigNumber(value).dividedBy(10).times('1000000000');
    } catch (err) {
      console.info('failed to get gas estimate - will use default');
      console.error(err);
      return;
    }
  }
}
