import { Repository } from './repository';

export interface ILog {
  [index: string]: any;
  dateCreated: Date;
  message: string;
  type: string;
  severity: 'critical' | 'error' | 'success' | 'info';
}

export interface IStoredLog extends ILog {
  _id: string;
}

export class LogRepository extends Repository<ILog, IStoredLog> {
}

export const logRepository = new LogRepository();
