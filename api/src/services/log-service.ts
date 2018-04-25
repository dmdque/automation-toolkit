import { IStoredLog, logRepository } from '../db/log-repository';

export type LogTypes = 'market' | 'band';

export interface IAddLogParams<T extends LogTypes> {
  type: T;
  message: string;
  severity: IStoredLog['severity'];
  data: IAdditionalLogParams[T];
}

export interface IAddMarketLogParams {
  severity: IStoredLog['severity'];
  message: string;
  marketId: string;
}

export interface IAddBandLogParams {
  severity: IStoredLog['severity'];
  message: string;
  bandId: string;
}

export interface IAdditionalLogParams {
  market: {
    marketId: string;
  };
  band: {
    bandId: string;
  };
}

export interface ILogService {
  getMarketLogs(marketId: string): Promise<IStoredLog[]>;
  getBandLogs(bandId: string): Promise<IStoredLog[]>;
  addMarketLog({ severity, message, marketId }: IAddMarketLogParams): void;
  addBandLog({ severity, message, bandId }: IAddBandLogParams): void;
  add<T extends LogTypes>(params: IAddLogParams<T>): Promise<IStoredLog>;
}

export class LogService implements ILogService {
  public async getMarketLogs(marketId: string): Promise<IStoredLog[]> {
    return await logRepository.find({ marketId }, {
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      },
      limit: 100
    });
  }

  public async getBandLogs(bandId: string): Promise<IStoredLog[]> {
    return await logRepository.find({ bandId }, {
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      },
      limit: 100
    });
  }

  public async addMarketLog({ severity, message, marketId }: IAddMarketLogParams) {
    this.add({
      type: 'market',
      severity,
      message,
      data: {
        marketId
      }
    });
  }

  public async addBandLog({ severity, message, bandId }: IAddBandLogParams) {
    this.add({
      type: 'band',
      severity,
      message,
      data: {
        bandId
      }
    });
  }

  public async add<T extends LogTypes>(params: IAddLogParams<T>) {
    const data: any = params.data || {};

    return await logRepository.create({
      message: params.message,
      severity: params.severity,
      type: params.type,
      ...data,
      dateCreated: new Date()
    });
  }
}
