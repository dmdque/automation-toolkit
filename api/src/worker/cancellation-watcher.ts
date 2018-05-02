import * as moment from 'moment';
import { logRepository } from '../db/log-repository';
import { LogService } from '../services/log-service';
import { AqueductRemote } from '../swagger/aqueduct-remote';

export class CancellationWatcher {
  private isProcessing = false;
  private readonly logService = new LogService();

  constructor(
    private readonly tradingService: AqueductRemote.Api.ITradingService = new AqueductRemote.Api.TradingService()
  ) { }

  public start() {
    setInterval(async () => {
      if (this.isProcessing) { return; }

      this.isProcessing = true;
      await this.cycle();
      this.isProcessing = false;
    }, 30000);
  }

  public async cycle() {
    const cancellationLogs = await this.logService.getPendingCancelLogs();
    for (let log of cancellationLogs) {
      try {
        const receipt = await this.tradingService.getCancelReceipt({ txHash: log.txHash });
        log.gasAmount = receipt.gasCost;
        await logRepository.update({ _id: log._id }, log);
      } catch {
        if (moment(log.dateCreated).isBefore(moment().subtract(3, 'hours'))) {
          log.gasAmount = 'unknown';
          await logRepository.update({ _id: log._id}, log);
        }
      }
    }
  }
}
