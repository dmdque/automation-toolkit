import { expect } from 'chai';
import * as moment from 'moment';
import { logRepository } from '../../db/log-repository';
import { IStoredCancelLog, LogService } from '../../services/log-service';
import { AqueductRemote } from '../../swagger/aqueduct-remote';
import { CancellationWatcher } from '../../worker/cancellation-watcher';
import { mock } from '../utils/mock';

describe('CancellationWatcher', () => {
  const logService = new LogService();

  it ('should update logs appropriately if receipt returns', async () => {
    const log = await logService.addCancelLog({
      txHash: 'first-tx-hash',
      order: {} as any,
      marketId: 'any-market-id'
    });

    const watcher = new CancellationWatcher(mock<AqueductRemote.Api.ITradingService>({
      getCancelReceipt: async () => {
        return {
          gasCost: '1234',
          status: 0
        };
      }
    }));

    await watcher.cycle();

    const updatedLog = await logRepository.findOne({ _id: log._id }) as IStoredCancelLog;
    expect(updatedLog.gasAmount).to.equal('1234');
  });

  it ('should update logs appropriate if stale tx', async () => {
    const log = await logService.addCancelLog({
      txHash: 'first-tx-hash',
      order: {} as any,
      marketId: 'any-market-id'
    });
    log.dateCreated = moment().subtract(1, 'day').toDate();
    await logRepository.update({ _id: log._id }, log);

    const watcher = new CancellationWatcher(mock<AqueductRemote.Api.ITradingService>({
      getCancelReceipt: async () => {
        throw new Error();
      }
    }));

    await watcher.cycle();
    const updatedLog = await logRepository.findOne({ _id: log._id }) as IStoredCancelLog;
    expect(updatedLog.gasAmount).to.equal('unknown');
  });
});
