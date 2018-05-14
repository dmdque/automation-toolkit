import { ITokenPairCache, tokenPairCache } from '../cache/token-pair-cache';
import { config } from '../config';
import { IStoredMarket, ITokenPair, marketRepository } from '../db/market-repository';
import { IStoredOrder, orderRepository, State } from '../db/order-repository';
import { BandService } from '../services/band-service';
import { IOrderService, OrderService } from '../services/order-service';
import { PriceFeed } from '../services/price-feed';
import { getOrderSide } from '../utils/order-utils';

export class SoftCancellationWatcher {
  private isProcessing = false;

  constructor(
    private readonly priceFeed: PriceFeed = config.priceFeed,
    private readonly bandService: BandService = new BandService(),
    private readonly tpCache: ITokenPairCache = tokenPairCache,
    private readonly orderService: IOrderService = new OrderService()
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
    const markets = await marketRepository.find({});
    for (let market of markets) {
      const tokenPair = await this.tpCache.getTokenPair({
        baseSymbol: market.baseTokenSymbol,
        quoteSymbol: market.quoteTokenSymbol,
        networkId: config.networkId
      });

      const softCanceledOrders = await orderRepository.find({ marketId: market._id, softCanceled: true });
      for (let order of softCanceledOrders) {
        await this.processOrder({ order, market, tokenPair });
      }
    }
  }

  private async processOrder({ order, tokenPair, market }: { order: IStoredOrder; tokenPair: ITokenPair; market: IStoredMarket; }) {
    if (order.expirationUnixTimestampSec <= (new Date().getTime() / 1000)) {
      order.state = State.Expired;
      order.softCanceled = false;
      await this.orderService.updateOrder(order);
      return;
    }

    const side = getOrderSide({ order, tokenPair });

    const highestBand = await this.bandService.getBottomBand({ side, marketId: market._id });
    if (!highestBand) {
      // there are no bands, we have to cancel this one
      if (market.cancellationMode === 'soft') {
        await this.orderService.softCancelOrder(order);
      } else {
        await this.orderService.cancelOrder(order);
      }
      return;
    }

    const price = await this.priceFeed.getPrice(tokenPair.tokenA.symbol, tokenPair.tokenB.symbol);

    const containment = await this.bandService.bandContainmentStatus({
      band: highestBand,
      order,
      baseDecimals: tokenPair.tokenA.decimals,
      price
    });

    // gotta cancel it
    if (containment === 'loss-risk') {
      if (market.cancellationMode === 'soft') {
        await this.orderService.softCancelOrder(order);
      } else {
        await this.orderService.cancelOrder(order);
      }
    }
  }
}
