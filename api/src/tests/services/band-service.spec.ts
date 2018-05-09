import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { IStoredBand } from '../../db/band-repository';
import { IStoredLog, logRepository } from '../../db/log-repository';
import { IStoredMarket } from '../../db/market-repository';
import { IStoredOrder, orderRepository, State } from '../../db/order-repository';
import { BandService } from '../../services/band-service';
import { PriceFeed } from '../../services/price-feed';
import { AqueductRemote } from '../../swagger/aqueduct-remote';
import { getAbsoluteSpread, toBaseUnitAmount } from '../../utils/conversion';
import { getOrderAttributes } from '../../utils/order-utils';
import { bandFixture } from '../fixtures/band-fixture';
import { marketFixture } from '../fixtures/market-fixture';
import { clearDatabases } from '../fixtures/prepare-db';
import { ScamToken, tokenPair, tokenPairCacheFixture, WackToken } from '../fixtures/tokens';
import { shouldThrow } from '../should-throw';
import { mock } from '../utils/mock';

const scamUnits = (value: number) => toBaseUnitAmount({ token: ScamToken, value }).toString();
const wackUnits = (value: number) => toBaseUnitAmount({ token: WackToken, value }).toString();
const ethUnits = (value: number) => toBaseUnitAmount({ token: { decimals: 18 }, value }).toString();

describe('BandService', () => {
  let validMarket: IStoredMarket;
  let validSellBand: IStoredBand;
  let validBuyBand: IStoredBand;
  let price: BigNumber;
  let id: number;
  let bandService: BandService;
  let createdOrderMap: { [id: number]: AqueductRemote.Api.IOrder };
  let remoteOrderMap: { [id: number]: Aqueduct.Api.Order; };

  interface ICreateOrderParams {
    band: IStoredBand;
    expectedPrice: BigNumber;
    expectedQuantity: string;
  }

  beforeEach(async () => {
    await clearDatabases();
    validMarket = await marketFixture({
      label: 'Valid Market One',
      initialBaseAmount: scamUnits(5),
      initialQuoteAmount: wackUnits(10),
      minBaseAmount: scamUnits(1),
      minEthAmount: ethUnits(.25),
      minQuoteAmount: wackUnits(1)
    });

    validBuyBand = await bandFixture({
      marketId: validMarket._id,
      minUnits: 100,
      side: 'buy',
      spreadBps: 50,
      toleranceBps: 10,
      units: 300
    });

    validSellBand = await bandFixture({
      marketId: validMarket._id,
      minUnits: 100,
      side: 'sell',
      spreadBps: 50,
      toleranceBps: 10,
      units: 300
    });

    price = new BigNumber(100);
    id = 1;
    bandService = undefined as any;
    createdOrderMap = {};
    remoteOrderMap = {};
  });

  afterEach(async () => {
    await clearDatabases();
  });

  it('should throw error on invalid market id', async () => {
    const band = await bandFixture({
      marketId: 'made-up-id',
      minUnits: 100,
      side: 'buy',
      spreadBps: 50,
      toleranceBps: 10,
      units: 300
    });

    bandService = new BandService();

    const err = await shouldThrow(() => bandService.start(band));
    expect(err.status).to.equal(404);
    expect(err.constructor.name).to.equal('ServerError');
  });

  it('should record error when price feed fails', async () => {
    const errorMessage = 'price feed fail';
    class TestPriceFeed extends PriceFeed {
      public async getPrice(): Promise<BigNumber> {
        throw new Error(errorMessage);
      }
    }

    bandService = new BandService({
      priceFeed: new TestPriceFeed(),
      tpCache: tokenPairCacheFixture
    });

    await bandService.start(validBuyBand);

    // there should be a critical log
    const log = await logRepository.findOne({}) as IStoredLog;
    expect(log).to.not.equal(undefined);
    expect(log.message).to.equal(errorMessage);
    expect(log.severity).to.equal('critical');
  });

  const shouldThrowOnInvalidBalance = async (band: IStoredBand) => {
    price = new BigNumber(100);
    class TestPriceFeed extends PriceFeed {
      public async getPrice(): Promise<BigNumber> {
        return price;
      }
    }

    const baseBalance = new BigNumber(validMarket.minBaseAmount).minus(1).toString();
    const quoteBalance = new BigNumber(validMarket.minQuoteAmount).minus(1).toString();

    bandService = new BandService({
      priceFeed: new TestPriceFeed(),
      tpCache: tokenPairCacheFixture,
      walletService: mock<AqueductRemote.Api.IWalletService>({
        getBalance: async params => {
          if (params.tokenAddress === ScamToken.address) { return baseBalance; }
          if (params.tokenAddress === WackToken.address) { return quoteBalance; }
          throw new Error('invalid token');
        }
      })
    });

    await bandService.start(band);

    // there should be a critical log
    const log = await logRepository.findOne({}) as IStoredLog;
    expect(log).to.not.equal(undefined);
    expect(log.severity).to.equal('critical');

    if (band.side === 'buy') {
      expect(log.message).to.equal(
        `balance is lower than minimum quote token amount: ${quoteBalance}/${validMarket.minQuoteAmount}`);
    } else {
      expect(log.message).to.equal(
        `balance is lower than minimum base token amount: ${baseBalance}/${validMarket.minBaseAmount}`);
    }
  };

  it('should record error when insufficient balance on buy', async () => {
    await shouldThrowOnInvalidBalance(validBuyBand);
  });

  it('should record error when insufficient balance on sell', async () => {
    await shouldThrowOnInvalidBalance(validSellBand);
  });

  const shouldCreateOrder = async ({ band, expectedPrice, expectedQuantity }: ICreateOrderParams) => {
    class TestPriceFeed extends PriceFeed {
      public async getPrice(): Promise<BigNumber> {
        return price;
      }
    }

    const baseBalance = new BigNumber(validMarket.maxBaseAmount).toString();
    const quoteBalance = new BigNumber(validMarket.maxQuoteAmount).toString();

    let orderRequest: AqueductRemote.Api.ILimitOrderRequest | undefined;

    bandService = new BandService({
      priceFeed: new TestPriceFeed(),
      tpCache: tokenPairCacheFixture,
      walletService: mock<AqueductRemote.Api.IWalletService>({
        getBalance: async params => {
          if (params.tokenAddress === ScamToken.address) { return baseBalance; }
          if (params.tokenAddress === WackToken.address) { return quoteBalance; }
          throw new Error('invalid token');
        }
      }),
      tradingService: mock<AqueductRemote.Api.ITradingService>({
        createLimitOrder: async ({ request }) => {
          orderRequest = request;

          const { makerTokenAmount, takerTokenAmount } = getOrderAttributes({
            side: band.side as 'buy' | 'sell',
            price: new BigNumber(request.price),
            quantityInWei: new BigNumber(request.quantityInWei)
          });

          const createdOrder = createdOrderMap[id] = {
            id,
            makerTokenAmount: makerTokenAmount.toString(),
            takerTokenAmount: takerTokenAmount.toString(),
            remainingTakerTokenAmount: takerTokenAmount.toString(),
            state: State.Open
          } as AqueductRemote.Api.IOrder;

          remoteOrderMap[id] = {
            ...createdOrder
          } as Aqueduct.Api.Order;

          id++;
          return createdOrder;
        },
        cancelOrder: async () => {
          return 'a-tx-hash';
        },
        softCancelOrder: async () => { return; }
      }),
      aqueductOrdersService: mock<Aqueduct.Api.OrdersService>({
        getById: async ({ orderId }) => {
          return remoteOrderMap[orderId];
        }
      })
    });

    await bandService.start(band);

    const req = orderRequest as AqueductRemote.Api.ILimitOrderRequest;
    expect(req).to.not.equal(undefined);
    expect(req.price).to.equal(expectedPrice.toString());
    expect(req.quantityInWei).to.equal(expectedQuantity);

    const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(order).to.not.equal(undefined);
    expect(order.state).to.equal(State.Open);
    expect(order.bandId).to.equal(band._id);

    return order;
  };

  const shouldCreateSellOrder = async () => {
    return await shouldCreateOrder({
      band: validSellBand,
      expectedPrice: price.plus(getAbsoluteSpread({
        price,
        spreadBps: validSellBand.spreadBps,
      })),
      // should be 100% of the available base quantity
      expectedQuantity: '5000000000000000000'
    });
  };

  const shouldCreateBuyOrder = async () => {
    return await shouldCreateOrder({
      band: validBuyBand,
      expectedPrice: price.minus(getAbsoluteSpread({
        price,
        spreadBps: validBuyBand.spreadBps,
      })),
      // should be 100% of the available base quantity
      expectedQuantity: '100502512562814070'
    });
  };

  it('should create order on fresh start w/ sell', async () => {
    await shouldCreateSellOrder();
  });

  it('should create order on fresh start w/ buy', async () => {
    await shouldCreateBuyOrder();
  });

  it('should cancel buy order if price falls out of the tolerance range', async () => {
    await shouldCreateBuyOrder();

    // original price is 100, spread is 50bps, tolerance is 10bps
    // the market price has gone down, making our buy order too high
    price = price.minus(getAbsoluteSpread({
      price,
      spreadBps: 70
    }));

    await bandService.start(validBuyBand);

    const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(order.state).to.not.equal(State.Open);
  });

  it('should cancel sell order if price falls out of the tolerance range', async () => {
    await shouldCreateSellOrder();

    // original price is .001, spread is 50bps, tolerance is 10bps
    // the market price has gone up, making our sell order too cheap
    price = price.add(getAbsoluteSpread({
      price,
      spreadBps: 61
    }));

    await bandService.start(validSellBand);

    const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(order.state).to.not.equal(State.Open);
  });

  const shouldNotCancelSellIfInTolerance = async (priceModFn: (p: BigNumber) => BigNumber) => {
    await shouldCreateSellOrder();

    price = priceModFn(price);

    await bandService.start(validSellBand);

    const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(order.state).to.equal(State.Open);

    const orders = await orderRepository.find({ bandId: validSellBand._id });
    expect(orders.length).to.equal(1);
  };

  it(`should not cancel sell order if price changes but does not fall out (down) of tolerance range`, async () => {
    await shouldNotCancelSellIfInTolerance(p => p.minus(getAbsoluteSpread({
      price,
      spreadBps: 5
    })));
  });

  it(`should not cancel sell order if price changes but does not fall out (up) of tolerance range`, async () => {
    await shouldNotCancelSellIfInTolerance(p => p.add(getAbsoluteSpread({
      price,
      spreadBps: 5
    })));
  });

  const shouldNotCancelBuyIfInTolerance = async (priceModFn: (p: BigNumber) => BigNumber) => {
    await shouldCreateBuyOrder();

    price = priceModFn(price);

    await bandService.start(validBuyBand);

    const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(order.state).to.equal(State.Open);

    const orders = await orderRepository.find({ bandId: validBuyBand._id });
    expect(orders.length).to.equal(1);
  };

  it(`should not cancel buy order if price changes but does not fall out (down) of tolerance range`, async () => {
    await shouldNotCancelBuyIfInTolerance(p => p.minus(getAbsoluteSpread({
      price,
      spreadBps: 5
    })));
  });

  it(`should not cancel buy order if price changes but does not fall out (up) of tolerance range`, async () => {
    await shouldNotCancelBuyIfInTolerance(p => p.add(getAbsoluteSpread({
      price,
      spreadBps: 5
    })));
  });

  it(`should *soft* cancel sell order if price changes, falls out of tolerance range,
      but falls towards being too 'high' (no loss risk) - should create new order`, async () => {
      await shouldCreateSellOrder();

      // original price is .001, spread is 50bps, tolerance is 10bps
      // the market price has gone down, making our sell order expensive (but not worth of canceling)
      price = price.minus(getAbsoluteSpread({
        price,
        spreadBps: 65
      }));

      await bandService.start(validSellBand);

      let order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
      expect(order.state).to.equal(State.Canceled);
      expect(order.softCanceled).to.equal(true);

      const orders = await orderRepository.find({ bandId: validSellBand._id, state: State.Open });
      expect(orders.length).to.equal(1);

      let newOrder = orders[0];
      expect(newOrder.state).to.equal(State.Open);
      expect(newOrder.bandId).to.equal(validSellBand._id);
    });

  it(`should *soft* cancel buy order if price changes, falls out of tolerance range,
      but falls towards being too 'low' (no loss risk) - should create new order`, async () => {
      await shouldCreateBuyOrder();

      // original price is .001, spread is 50bps, tolerance is 10bps
      // the market price has gone up, making our buy order cheap (but not worth of canceling)
      price = price.add(getAbsoluteSpread({
        price,
        spreadBps: 65
      }));

      await bandService.start(validBuyBand);

      const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
      expect(order.state).to.equal(State.Canceled);
      expect(order.softCanceled).to.equal(true);

      const orders = await orderRepository.find({ bandId: validBuyBand._id, state: State.Open });
      expect(orders.length).to.equal(1);

      const newOrder = orders[0];
      expect(newOrder.state).to.equal(State.Open);
      expect(newOrder.bandId).to.equal(validBuyBand._id);
    });

  it('should remove and replace order that is expired', async () => {
    const order = await shouldCreateBuyOrder();

    // manually change the expiration
    order.expirationUnixTimestampSec = new Date().getTime() / 1000;
    await orderRepository.update({ _id: order._id }, order);

    await bandService.start(validBuyBand);

    const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(updatedOrder.state).to.equal(State.Expired);

    const newOrder = await orderRepository.findOne({ id: 2 }) as IStoredOrder;
    expect(newOrder.state).to.equal(State.Open);
    expect(newOrder.bandId).to.equal(validBuyBand._id);
  });

  it('should remove and replace order has been marked as invalid remotely', async () => {
    await shouldCreateBuyOrder();

    // manually change the remote state
    remoteOrderMap[1].state = 4;

    await bandService.start(validBuyBand);

    const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(updatedOrder.state).to.equal(4);

    const newOrder = await orderRepository.findOne({ id: 2 }) as IStoredOrder;
    expect(newOrder.state).to.equal(State.Open);
    expect(newOrder.bandId).to.equal(validBuyBand._id);
  });

  it('should not open additional buy orders if filled amount is above threshold', async () => {
    const order = await shouldCreateBuyOrder();

    const availableBalance = await bandService.getAvailableBalance({
      side: validBuyBand.side as 'buy' | 'sell',
      market: validMarket,
      tokenPair
    });

    const minMakerAmount = availableBalance.times(validBuyBand.minUnits).dividedBy(validBuyBand.units);
    const minTakerAmount = minMakerAmount.times(order.takerTokenAmount).dividedBy(order.makerTokenAmount);

    remoteOrderMap[1].remainingTakerTokenAmount = minTakerAmount.add(1).toString();
    await bandService.start(validBuyBand);

    const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(updatedOrder.state).to.equal(State.Open);
    expect(updatedOrder.remainingTakerTokenAmount).to.equal(remoteOrderMap[1].remainingTakerTokenAmount);

    const orderCount = await orderRepository.count({ bandId: validBuyBand._id });
    expect(orderCount).to.equal(1);
  });

  it('should not open additional sell orders if filled amount is above threshold', async () => {
    const order = await shouldCreateSellOrder();
    console.log(order);

    const availableBalance = await bandService.getAvailableBalance({
      side: validSellBand.side as 'buy' | 'sell',
      market: validMarket,
      tokenPair
    });

    const minMakerAmount = availableBalance.times(validSellBand.minUnits).dividedBy(validSellBand.units);
    const minTakerAmount = minMakerAmount.times(order.takerTokenAmount).dividedBy(order.makerTokenAmount);

    remoteOrderMap[1].remainingTakerTokenAmount = minTakerAmount.add(1).toString();
    await bandService.start(validSellBand);

    const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
    expect(updatedOrder.state).to.equal(State.Open);
    expect(updatedOrder.remainingTakerTokenAmount).to.equal(remoteOrderMap[1].remainingTakerTokenAmount);

    const orderCount = await orderRepository.count({ bandId: validSellBand._id });
    expect(orderCount).to.equal(1);
  });

  it(`should open additional buy orders if filled amount is below threshold,
      and the existing order should continue to exist and be valid`, async () => {
      const order = await shouldCreateBuyOrder();

      const availableBalance = await bandService.getAvailableBalance({
        side: validBuyBand.side as 'buy' | 'sell',
        market: validMarket,
        tokenPair
      });

      const minMakerAmount = availableBalance.times(validBuyBand.minUnits).dividedBy(validBuyBand.units);
      const minTakerAmount = minMakerAmount.times(order.takerTokenAmount).dividedBy(order.makerTokenAmount);

      remoteOrderMap[1].remainingTakerTokenAmount = minTakerAmount.minus(1).toString();
      await bandService.start(validBuyBand);

      const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
      expect(updatedOrder.state).to.equal(State.Open);
      expect(updatedOrder.remainingTakerTokenAmount).to.equal(remoteOrderMap[1].remainingTakerTokenAmount);

      const orderCount = await orderRepository.count({ bandId: validBuyBand._id });
      expect(orderCount).to.equal(2);

      const newOrder = await orderRepository.findOne({ id: 2 }) as IStoredOrder;
      expect(newOrder.state).to.equal(State.Open);
      expect(newOrder.takerTokenAmount).to.equal(
        new BigNumber(updatedOrder.takerTokenAmount).minus(updatedOrder.remainingTakerTokenAmount).round().toString());
    });

  it(`should open additional sell orders if filled amount is below threshold,
      and the existing order should continue to exist and be valid`, async () => {
      const order = await shouldCreateSellOrder();

      const availableBalance = await bandService.getAvailableBalance({
        side: validSellBand.side as 'buy' | 'sell',
        market: validMarket,
        tokenPair
      });

      const minMakerAmount = availableBalance.times(validSellBand.minUnits).dividedBy(validSellBand.units);
      const minTakerAmount = minMakerAmount.times(order.takerTokenAmount).dividedBy(order.makerTokenAmount);

      remoteOrderMap[1].remainingTakerTokenAmount = minTakerAmount.minus(1).round().toString();
      await bandService.start(validSellBand);

      const updatedOrder = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
      expect(updatedOrder.state).to.equal(State.Open);
      expect(updatedOrder.remainingTakerTokenAmount).to.equal(remoteOrderMap[1].remainingTakerTokenAmount);

      const orderCount = await orderRepository.count({ bandId: validSellBand._id });
      expect(orderCount).to.equal(2);

      const newOrder = await orderRepository.findOne({ id: 2 }) as IStoredOrder;
      expect(newOrder.state).to.equal(State.Open);
      expect('335000000000000000001').to.equal(
        new BigNumber(updatedOrder.takerTokenAmount).minus(updatedOrder.remainingTakerTokenAmount).round().toString());
    });

  describe('multi-band', () => {
    describe('buy orders', () => {
      it('should be able to move up', async () => {
        await shouldCreateBuyOrder();

        const aboveBand = await bandFixture({
          marketId: validMarket._id,
          minUnits: 100,
          side: 'buy',
          spreadBps: 30,
          toleranceBps: 10,
          units: 300
        });

        price = new BigNumber(99.8);

        await bandService.start(validBuyBand);

        const orders = await orderRepository.find({ marketId: validMarket._id }, {
          sort: {
            direction: 'asc',
            key: 'id'
          }
        });
        expect(orders.length).to.equal(2);

        const firstOrder = orders[0];
        expect(firstOrder.bandId).to.equal(aboveBand._id);
        expect(firstOrder.state).to.equal(State.Open);

        const secondOrder = orders[1];
        expect(secondOrder.bandId).to.equal(validBuyBand._id);
        expect(secondOrder.state).to.equal(State.Open);
      });

      it('should be able to move down', async () => {
        await shouldCreateBuyOrder();

        const belowBand = await bandFixture({
          marketId: validMarket._id,
          minUnits: 100,
          side: 'buy',
          spreadBps: 70,
          toleranceBps: 10,
          units: 300
        });

        price = new BigNumber(100.2);

        await bandService.start(validBuyBand);

        const orders = await orderRepository.find({ marketId: validMarket._id }, {
          sort: {
            direction: 'asc',
            key: 'id'
          }
        });
        expect(orders.length).to.equal(2);

        const firstOrder = orders[0];
        expect(firstOrder.bandId).to.equal(belowBand._id);
        expect(firstOrder.state).to.equal(State.Open);

        const secondOrder = orders[1];
        expect(secondOrder.bandId).to.equal(validBuyBand._id);
        expect(secondOrder.state).to.equal(State.Open);
      });
    });

    describe('sell orders', () => {
      it('should be able to move up', async () => {
        await shouldCreateSellOrder();

        const aboveBand = await bandFixture({
          marketId: validMarket._id,
          minUnits: 100,
          side: 'sell',
          spreadBps: 70,
          toleranceBps: 10,
          units: 300
        });

        price = new BigNumber(99.8);

        await bandService.start(validSellBand);

        const orders = await orderRepository.find({ marketId: validMarket._id }, {
          sort: {
            direction: 'asc',
            key: 'id'
          }
        });
        expect(orders.length).to.equal(2);

        const firstOrder = orders[0];
        expect(firstOrder.bandId).to.equal(aboveBand._id);
        expect(firstOrder.state).to.equal(State.Open);

        const secondOrder = orders[1];
        expect(secondOrder.bandId).to.equal(validSellBand._id);
        expect(secondOrder.state).to.equal(State.Open);
      });

      it('should be able to move down', async () => {
        await shouldCreateSellOrder();

        const belowBand = await bandFixture({
          marketId: validMarket._id,
          minUnits: 100,
          side: 'sell',
          spreadBps: 30,
          toleranceBps: 10,
          units: 300
        });

        price = new BigNumber(100.2);

        await bandService.start(validSellBand);

        const orders = await orderRepository.find({ marketId: validMarket._id }, {
          sort: {
            direction: 'asc',
            key: 'id'
          }
        });
        expect(orders.length).to.equal(2);

        const firstOrder = orders[0];
        expect(firstOrder.bandId).to.equal(belowBand._id);
        expect(firstOrder.state).to.equal(State.Open);

        const secondOrder = orders[1];
        expect(secondOrder.bandId).to.equal(validSellBand._id);
        expect(secondOrder.state).to.equal(State.Open);
      });
    });
  });
});
