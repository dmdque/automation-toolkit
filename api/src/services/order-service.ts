import { Aqueduct } from 'aqueduct';
import { IStoredOrder, orderRepository, State } from '../db/order-repository';
import { AqueductRemote } from '../swagger/aqueduct-remote';
import { GasService } from './gas-service';
import { LogService } from './log-service';

export interface IOrderService {
  cancelOrder(order: IStoredOrder): Promise<void>;
  updateOrder(order: IStoredOrder): Promise<number>;
  softCancelOrder(order: IStoredOrder): Promise<void>;
  getValidatedOrder(order: IStoredOrder): Promise<false | IStoredOrder | undefined>;
}

export class OrderService implements IOrderService {
  private readonly logService = new LogService();

  constructor(
    private readonly tradingService: AqueductRemote.Api.ITradingService = new AqueductRemote.Api.TradingService(),
    private readonly aqueductOrdersService: Aqueduct.Api.IOrdersService = new Aqueduct.Api.OrdersService()
  ) { }

  public async cancelOrder(order: IStoredOrder) {
    const marketId = order.marketId;
    try {
      console.log('starting cancelation...');
      const gasPrice = await new GasService().getGasPrice();
      const txHash = await this.tradingService.cancelOrder({
        request: {
          orderHash: order.orderHash,
          gasPrice: gasPrice && gasPrice.toString()
        }
      });
      console.log('finished cancelation...');

      await this.logService.addCancelLog({ txHash, order, marketId });
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

  public async softCancelOrder(order: IStoredOrder) {
    const marketId = order.marketId;
    try {
      console.log('starting soft cancelation...');
      await this.tradingService.softCancelOrder({ orderHash: order.orderHash });
      console.log('finished soft cancelation...');

      await this.logService.addMarketLog({
        severity: 'info',
        marketId,
        message: `market ${marketId} soft canceled order ${order.id}`
      });
      order.state = State.Canceled;
      order.softCanceled = true;
    } catch (err) {
      await this.logService.addMarketLog({
        severity: 'critical',
        marketId,
        message: `market ${marketId} failed to soft cancel order ${order.id}: ${err.message}`
      });
    }

    await this.updateOrder(order);
  }

  public async updateOrder(order: IStoredOrder) {
    return await orderRepository.update({ id: order.id }, order);
  }

  public async getValidatedOrder(order: IStoredOrder) {
    // is it actually still valid?
    // is it expired?
    if (order.expirationUnixTimestampSec <= (new Date().getTime() / 1000)) {
      order.state = State.Expired;
      await this.updateOrder(order);

      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `order ${order.id} expired`,
          severity: 'error'
        });
      }
      return;
    }

    let remoteOrder: Aqueduct.Api.Order;
    // is it invalid for some other reason?
    try {
      remoteOrder = await this.aqueductOrdersService.getById({ orderId: order.id });
    } catch (err) {
      console.error(`failed to get order by id: ${err.message}`);
      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `failed to get order by id ${order.id}: ${err.message} - treating as still valid`,
          severity: 'error'
        });
      }

      // if the server fails, we have to treat this order as valid, otherwise we may overextend
      return order;
    }

    if (remoteOrder.state !== 0) {
      order.state = remoteOrder.state;

      if (order.bandId) {
        await this.logService.addBandLog({
          bandId: order.bandId,
          message: `order ${order.id} invalid with state ${remoteOrder.state} - removing, will refresh band`,
          severity: 'error'
        });
      }

      await this.updateOrder(order);
      return;
    }

    order.remainingTakerTokenAmount = remoteOrder.remainingTakerTokenAmount;
    await this.updateOrder(order);

    return order.remainingTakerTokenAmount !== '0' && order;
  }
}
