import { Get, Route, Tags } from 'tsoa';
import { IStoredLog } from '../db/log-repository';
import { LogService } from '../services/log-service';

@Route('logs')
export class LogsController {
  @Get('{marketId}')
  @Tags('Logs')
  public async getLogs(marketId: string): Promise<IStoredLog[]> {
    return await new LogService().getMarketLogs(marketId);
  }
}
