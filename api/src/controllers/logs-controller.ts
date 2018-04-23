import { Get, Route, Tags } from 'tsoa';
import { IStoredLog } from '../db/log-repository';
import { LogService } from '../services/log-service';

@Route('logs')
export class LogsController {
  @Get('market/{marketId}')
  @Tags('Logs')
  public async getMarketLogs(marketId: string): Promise<IStoredLog[]> {
    return await new LogService().getMarketLogs(marketId);
  }

  @Get('band/{bandId}')
  @Tags('Logs')
  public async getBandLogs(bandId: string): Promise<IStoredLog[]> {
    return await new LogService().getBandLogs(bandId);
  }
}
