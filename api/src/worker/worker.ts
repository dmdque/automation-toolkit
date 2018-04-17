import { Aqueduct } from 'aqueduct';
import { bandRepository } from '../db/band-repository';
import { marketRepository } from '../db/market-repository';
import { orderRepository } from '../db/order-repository';
import { BandService } from '../services/band-service';
import { LogService } from '../services/log-service';
import { AqueductRemote } from '../swagger/aqueduct-remote';

export interface IEvents {

}

export class Worker {
  private readonly bandService = new BandService();
  private readonly logService = new LogService();

  public async start() {
    await this.registerSubscriptions();

    const markets = await marketRepository.find({ active: true });
    for (let i = 0; i < markets.length; i++) {
      const market = markets[i];

      const bands = await bandRepository.find({ marketId: market._id });
      for (let index = 0; index < bands.length; index++) {
        const band = bands[index];
        await this.bandService.start(band);
      }
    }
  }

  private async registerSubscriptions() {
    const accounts = await new AqueductRemote.Api.WalletService().getAccounts();
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      new Aqueduct.Events.AccountOrderChange().subscribe({ account }, async data => {
        const existingOrder = await orderRepository.findOne({ id: data.order.id });
        if (!existingOrder) {
          return;
        }

        const band = await bandRepository.findOne({ _id: existingOrder.bandId });
        if (!band) {
          return;
        }

        const bandLog = async (message: string) => {
          await this.logService.addBandLog({
            bandId: existingOrder.bandId,
            message,
            severity: 'info'
          });
        };

        if (['canceled', 'expired', 'filled', 'removed'].indexOf(data.eventType) !== -1) {
          existingOrder.bound = false;
          await orderRepository.update({ _id: existingOrder._id }, existingOrder);
          await bandLog(`order ${existingOrder.id} ${data.eventType}; unbinding...`);
          await this.bandService.start(band);
        }
      });
    }
  }
}
