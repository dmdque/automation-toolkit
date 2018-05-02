import { IStoredOrder, orderRepository, State } from '../db/order-repository';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { LogService } from './log-service';

export interface IOrderService {
  cancelOrder(order: IStoredOrder): Promise<void>;
  updateOrder(order: IStoredOrder): Promise<number>;
}

export class OrderService implements IOrderService {
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
      order.state = State.Canceled;
      order.softCanceled = false;
    } catch (err) {
      await this.logService.addMarketLog({
        severity: 'critical',
        marketId,
        message: `market ${marketId} failed to cancel order ${order.id}: ${err.message}`
      });
    }

    await this.updateOrder(order);
  }

  public async updateOrder(order: IStoredOrder) {
    return await orderRepository.update({ id: order.id }, order);
  }
}
