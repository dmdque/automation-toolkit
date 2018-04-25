import { Aqueduct } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { IStoredBand } from '../../db/band-repository';
import { IStoredLog, logRepository } from '../../db/log-repository';
import { IStoredMarket } from '../../db/market-repository';
import { IStoredOrder, orderRepository } from '../../db/order-repository';
import { BandService } from '../../services/band-service';
import { PriceFeed } from '../../services/price-feed';
import { AqueductRemote } from '../../swagger/aqueduct-remote';
import { getAbsoluteSpread, toBaseUnitAmount } from '../../utils/conversion';
import { getOrderAttributes } from '../../utils/order-utils';
import { bandFixture } from '../fixtures/band-fixture';
import { marketFixture } from '../fixtures/market-fixture';
import { clearDatabases } from '../fixtures/prepare-db';
import { ScamToken, tokenPairCacheFixture, WackToken } from '../fixtures/tokens';
import { shouldThrow } from '../should-throw';

const mock = <T>(model: Partial<T>): T => model as T;

const scamUnits = (value: number) => toBaseUnitAmount({ token: ScamToken, value }).toString();
const wackUnits = (value: number) => toBaseUnitAmount({ token: WackToken, value }).toString();
const ethUnits = (value: number) => toBaseUnitAmount({ token: { decimals: 18 }, value }).toString();

describe('BandService', () => {
  let validMarket: IStoredMarket;
  let validSellBand: IStoredBand;
  let validBuyBand: IStoredBand;

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

    const bandService = new BandService({});

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

    const bandService = new BandService({
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
    let price: BigNumber = new BigNumber(.0001);
    class TestPriceFeed extends PriceFeed {
      public async getPrice(): Promise<BigNumber> {
        return price;
      }
    }

    const baseBalance = new BigNumber(validMarket.minBaseAmount).minus(1).toString();
    const quoteBalance = new BigNumber(validMarket.minQuoteAmount).minus(1).toString();

    const bandService = new BandService({
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

  describe('single band', () => {
    let price: BigNumber;
    let id: number;
    let bandService: BandService;
    let createdOrder: AqueductRemote.Api.IOrder;
    let remoteOrder: Aqueduct.Api.Order;

    interface ICreateOrderParams {
      band: IStoredBand;
      expectedPrice: BigNumber;
      expectedQuantity: string;
    }

    beforeEach(() => {
      price = new BigNumber(.001);
      id = 1;
    });

    const shouldCreateOrder = async ({ band, expectedPrice, expectedQuantity }: ICreateOrderParams) => {
      class TestPriceFeed extends PriceFeed {
        public async getPrice(): Promise<BigNumber> {
          return price;
        }
      }

      const baseBalance = new BigNumber(validMarket.initialBaseAmount).toString();
      const quoteBalance = new BigNumber(validMarket.initialQuoteAmount).toString();

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
              price: expectedPrice,
              quantityInWei: new BigNumber(request.quantityInWei)
            });

            createdOrder = {
              id,
              makerTokenAmount: makerTokenAmount.toString(),
              takerTokenAmount: takerTokenAmount.toString(),
              remainingTakerTokenAmount: takerTokenAmount.toString()
            } as AqueductRemote.Api.IOrder;
            id++;

            remoteOrder = {
              id: createdOrder.id,
              state: 0
            } as Aqueduct.Api.Order;

            return createdOrder;
          },
          cancelOrder: async () => {
            return 'a-tx-hash';
          }
        }),
        aqueductOrdersService: mock<Aqueduct.Api.OrdersService>({
          getById: async () => {
            return remoteOrder;
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
      expect(order.valid).to.equal(true);
      expect(order.bound).to.equal(true);
      expect(order.bandId).to.equal(band._id);
    };

    const shouldCreateSellOrder = async () => {
      await shouldCreateOrder({
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
      await shouldCreateOrder({
        band: validBuyBand,
        expectedPrice: price.minus(getAbsoluteSpread({
          price,
          spreadBps: validBuyBand.spreadBps,
        })),
        // should be 100% of the available base quantity
        expectedQuantity: '10050251256281407035176'
      });
    };

    it('should create order on fresh start w/ sell', async () => {
      await shouldCreateSellOrder();
    });

    it('should create order on fresh start w/ buy', async () => {
      await shouldCreateBuyOrder();
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
      expect(order.valid).to.equal(false);
      expect(order.bound).to.equal(false);
    });

    const shouldNotCancelIfInTolerance = async (priceModFn: (p: BigNumber) => BigNumber) => {
      await shouldCreateSellOrder();

      price = priceModFn(price);

      await bandService.start(validSellBand);

      const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
      expect(order.valid).to.equal(true);
      expect(order.bound).to.equal(true);
      expect(order.bandId).to.not.equal(undefined);

      const orders = await orderRepository.find({ bandId: validSellBand._id });
      expect(orders.length).to.equal(1);
    };

    it(`should not cancel sell order if price changes but does not fall out (down) of tolerance range`, async () => {
      await shouldNotCancelIfInTolerance(p => p.minus(getAbsoluteSpread({
        price,
        spreadBps: 5
      })));
    });

    it(`should not cancel sell order if price changes but does not fall out (up) of tolerance range`, async () => {
      await shouldNotCancelIfInTolerance(p => p.add(getAbsoluteSpread({
        price,
        spreadBps: 5
      })));
    });

    it(`should not cancel sell order if price changes, falls out of tolerance range,
      but falls towards being too 'high' (no loss risk) - should create new order`, async () => {
        await shouldCreateSellOrder();

        // original price is .001, spread is 50bps, tolerance is 10bps
        // the market price has gone down, making our sell order expensive (but not worth of canceling)
        price = price.minus(getAbsoluteSpread({
          price,
          spreadBps: 65
        }));

        await bandService.start(validSellBand);

        const order = await orderRepository.findOne({ id: 1 }) as IStoredOrder;
        expect(order.valid).to.equal(true);
        expect(order.bound).to.equal(false);
        expect(order.bandId).to.equal(undefined);

        const orders = await orderRepository.find({ bandId: validSellBand._id });
        expect(orders.length).to.equal(1);

        const newOrder = orders[0];
        expect(newOrder.valid).to.equal(true);
        expect(newOrder.bound).to.equal(true);
        expect(newOrder.bandId).to.equal(validSellBand._id);
      });
  });
});
