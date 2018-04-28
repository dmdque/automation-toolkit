import { bandRepository } from '../../db/band-repository';
import { logRepository } from '../../db/log-repository';
import { marketRepository } from '../../db/market-repository';
import { marketStatsHistoryRepository } from '../../db/market-stats-history-repository';
import { orderRepository } from '../../db/order-repository';
import { parityAccountRepository } from '../../db/parity-account-repository';
import { Repository } from '../../db/repository';

export const clearDatabases = async () => {
  const repos = [
    bandRepository,
    logRepository,
    marketRepository,
    marketStatsHistoryRepository,
    orderRepository,
    parityAccountRepository
  ];

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i] as Repository<any, any>;
    await repo.delete({});
  }
};
