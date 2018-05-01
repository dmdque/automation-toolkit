import * as moment from 'moment';
import { config } from '../config';
import { IStoredCancelLog, LogService } from '../services/log-service';
import { toUnitAmount } from '../utils/conversion';
import { IReportConfiguration, Report } from './report';

export class CancelationReport extends Report<IStoredCancelLog> {
  constructor(private readonly marketId: string) {
    super();
   }

  protected async getConfig(): Promise<IReportConfiguration<IStoredCancelLog>> {
    const models = await new LogService().getAllCancelLogs(this.marketId);
    const ethPrice = await config.priceFeed.getPrice('ETH', 'USD');

    return {
      label: 'cx-report',
      models,
      columns: [
        {
          header: 'Date Created',
          getElement: l => moment(l.order.dateCreated).format('MM/DD/YY HH:mm:ss')
        },
        {
          header: 'Date Canceled',
          getElement: l => moment(l.dateCreated).format('MM/DD/YY HH:mm:ss')
        },
        {
          header: 'Mined Status',
          getElement: l => {
            if (l.gasAmount === 'pending') { return 'Pending'; }
            if (l.gasAmount === 'unknown') { return 'Unknown'; }
            return 'Mined';
          }
        },
        {
          header: 'Gas Used (ETH)',
          getElement: l => {
            if (l.gasAmount === 'pending' || l.gasAmount === 'unknown') { return ''; }

            const ethUnitAmount = toUnitAmount({ token: { decimals: 18 }, value: l.gasAmount });
            return ethUnitAmount.round(4).toString();
          }
        },
        {
          header: 'Gas Used (USD)',
          getElement: l => {
            if (l.gasAmount === 'pending' || l.gasAmount === 'unknown') { return ''; }

            const ethUnitAmount = toUnitAmount({ token: { decimals: 18 }, value: l.gasAmount });
            const ethUsdAmount = ethPrice.times(ethUnitAmount).round(4);
            return ethUsdAmount.toString();
          }
        }
      ]
    };
  }
}
