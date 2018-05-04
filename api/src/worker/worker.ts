import { marketRepository } from '../db/market-repository';
import { MarketService } from '../services/market-service';
import { CancellationWatcher } from './cancellation-watcher';
import { marketWatcher } from './market-watcher';
import { SoftCancellationWatcher } from './soft-cancellation-watcher';

export class Worker {
  private readonly marketService = new MarketService();

  public async start() {
    this.watchMarketStats();
    await marketWatcher.start();
    new CancellationWatcher().start();
    new SoftCancellationWatcher().start();
  }

  private watchMarketStats() {
    let isProcessing = false;
    setInterval(async () => {
      if (isProcessing) { return; }
      isProcessing = true;

      try {
        const markets = await marketRepository.find({});
        for (let i = 0; i < markets.length; i++) {
          await this.marketService.generateStats(markets[i]._id);
        }
      } catch (err) {
        console.error(err);
      }
      isProcessing = false;
    }, 15000);
  }
}
