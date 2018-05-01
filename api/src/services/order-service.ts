import { IStoredOrder, orderRepository } from '../db/order-repository';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { LogService } from './log-service';

export class OrderService {
  private readonly logService = new LogService();

  public async cancelOrder(order: IStoredOrder) {
    const marketId = order.marketId;
    try {
      console.log('starting cancelation...');
      const txHash = await new AqueductRemote.Api.TradingService().cancelOrder({ orderHash: order.orderHash });
      console.log('finished cancelation...');

      await this.logService.addCancelLog({ txHash, order, marketId  });
      await this.logService.addMarketLog({
        severity: 'info',
        marketId,
        message: `market ${marketId} canceled order ${order.id} w/ tx ${txHash}`
      });
      order.valid = false;
    } catch (err) {
      await this.logService.addMarketLog({
        severity: 'critical',
        marketId,
        message: `market ${marketId} failed to cancel order ${order.id}: ${err.message}`
      });
    }

    order.bound = false;
    await orderRepository.update({ id: order.id }, order);
  }
}
