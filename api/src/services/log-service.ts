import { IStoredLog, logRepository } from '../db/log-repository';
import { IStoredOrder } from '../db/order-repository';

export type LogTypes = 'market' | 'band' | 'cancel';

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

export interface IAddCancelLogParams {
  txHash: string;
  order: IStoredOrder;
  marketId: string;
}

export interface IAdditionalLogParams {
  market: {
    marketId: string;
  };
  band: {
    bandId: string;
  };
  cancel: {
    marketId: string;
    txHash: string;
    order: IStoredOrder;
    gasAmount: string | 'mining' | 'unknown';
  };
}

export interface IStoredCancelLog extends IStoredLog {
  txHash: string;
  order: IStoredOrder;
  gasAmount: string | 'mining' | 'unknown';
}

export interface ILogService {
  getMarketLogs(marketId: string): Promise<IStoredLog[]>;
  getBandLogs(bandId: string): Promise<IStoredLog[]>;
  addMarketLog({ severity, message, marketId }: IAddMarketLogParams): Promise<IStoredLog>;
  addBandLog({ severity, message, bandId }: IAddBandLogParams): Promise<IStoredLog>;
  add<T extends LogTypes>(params: IAddLogParams<T>): Promise<IStoredLog>;
  addCancelLog({ txHash, order }: IAddCancelLogParams): Promise<IStoredCancelLog>;
  getPendingCancelLogs(): Promise<IStoredCancelLog[]>;
  getAllCancelLogs(marketId: string): Promise<IStoredCancelLog[]>;
}

export class LogService implements ILogService {
  public async getMarketLogs(marketId: string): Promise<IStoredLog[]> {
    return await logRepository.find({
      marketId,
      type: 'market'
    }, {
        sort: {
          direction: 'desc',
          key: 'dateCreated'
        },
        limit: 100
      });
  }

  public async getBandLogs(bandId: string): Promise<IStoredLog[]> {
    return await logRepository.find({
      bandId,
      type: 'band'
    }, {
        sort: {
          direction: 'desc',
          key: 'dateCreated'
        },
        limit: 100
      });
  }

  public async getPendingCancelLogs(): Promise<IStoredCancelLog[]> {
    return await logRepository.find({ type: 'cancel', gasAmount: 'mining' }, {
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      }
    }) as IStoredCancelLog[];
  }

  public async getAllCancelLogs(marketId: string): Promise<IStoredCancelLog[]> {
    return await logRepository.find({ type: 'cancel', marketId }, {
      sort: {
        direction: 'desc',
        key: 'dateCreated'
      }
    }) as IStoredCancelLog[];
  }

  public async addMarketLog({ severity, message, marketId }: IAddMarketLogParams) {
    return this.add({
      type: 'market',
      severity,
      message,
      data: {
        marketId
      }
    });
  }

  public async addBandLog({ severity, message, bandId }: IAddBandLogParams) {
    return this.add({
      type: 'band',
      severity,
      message,
      data: {
        bandId
      }
    });
  }

  public async addCancelLog({ txHash, order, marketId }: IAddCancelLogParams): Promise<IStoredCancelLog> {
    return await this.add({
      type: 'cancel',
      severity: 'info',
      message: 'cancel',
      data: {
        txHash,
        order,
        gasAmount: 'mining',
        marketId
      }
    }) as IStoredCancelLog;
  }

  public async add<T extends LogTypes>(params: IAddLogParams<T>) {
    console.info(params.message);
    const data: any = params.data || {};

    return await logRepository.create({
      message: params.message,
      severity: params.severity,
      type: params.type,
      dateCreated: new Date(),
      ...data
    });
  }
}
