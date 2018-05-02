import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import * as moment from 'moment';
import { bandRepository, IStoredBand } from '../../db/band-repository';
import { IStoredMarket } from '../../db/market-repository';
import { IStoredOrder, orderRepository, State } from '../../db/order-repository';
import { PriceFeed } from '../../services/price-feed';
import { toBaseUnitAmount } from '../../utils/conversion';
import { SoftCancellationWatcher } from '../../worker/soft-cancellation-watcher';
import { bandFixture } from '../fixtures/band-fixture';
import { marketFixture } from '../fixtures/market-fixture';
import { clearDatabases } from '../fixtures/prepare-db';
import { ScamToken, tokenPairCacheFixture, WackToken } from '../fixtures/tokens';

const scamUnits = (value: number) => toBaseUnitAmount({ token: ScamToken, value }).toString();
const wackUnits = (value: number) => toBaseUnitAmount({ token: WackToken, value }).toString();
const ethUnits = (value: number) => toBaseUnitAmount({ token: { decimals: 18 }, value }).toString();

describe('SoftCancellationWatcher', () => {
  let validMarket: IStoredMarket;
  let validSellBand: IStoredBand;
  let order: IStoredOrder;
  let price = new BigNumber(100);

  class TestPriceFeed extends PriceFeed {
    public async getPrice(): Promise<BigNumber> {
      return price;
    }
  }

  let service = new SoftCancellationWatcher(
    new TestPriceFeed(),
    undefined,
    tokenPairCacheFixture,
    {
      cancelOrder: async o => {
        o.softCanceled = false;
        await orderRepository.update({ _id: o._id }, o);
      },
      updateOrder: async o => {
        return await orderRepository.update({ _id: o._id }, o);
      }
    }
  );

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

    validSellBand = await bandFixture({
      marketId: validMarket._id,
      minUnits: 100,
      side: 'sell',
      spreadBps: 50,
      toleranceBps: 10,
      units: 300
    });

    order = await orderRepository.create({
      id: 1,
      makerTokenAddress: ScamToken.address,
      takerTokenAddress: WackToken.address,
      makerTokenAmount: '5000000000000000000',
      takerTokenAmount: '502500000000000000000',
      remainingTakerTokenAmount: '502500000000000000000',
      state: State.Canceled,
      expirationUnixTimestampSec: (moment().add(1, 'day').toDate().getTime()) / 1000,
      bandId: validSellBand._id,
      marketId: validMarket._id,
      softCanceled: true
    } as IStoredOrder);
  });

  afterEach(async () => {
    await clearDatabases();
  });

  it('should hard remove expired orders', async () => {
    order.expirationUnixTimestampSec = (new Date().getTime() / 1000) - 5;
    await orderRepository.update({ _id: order._id }, order);

    await service.cycle();

    const updatedOrder = await orderRepository.findOne({ id: order.id }) as IStoredOrder;
    expect(updatedOrder.softCanceled).to.equal(false);
  });

  it('should hard remove if there are no bands', async () => {
    await bandRepository.delete({ _id: validSellBand._id });

    await service.cycle();
    const updatedOrder = await orderRepository.findOne({ id: order.id }) as IStoredOrder;
    expect(updatedOrder.softCanceled).to.equal(false);
  });

  it('should not remove if price is in band', async () => {
    await service.cycle();

    const updatedOrder = await orderRepository.findOne({ id: order.id }) as IStoredOrder;
    expect(updatedOrder.softCanceled).to.equal(true);
  });

  it('should remove if price is out of band', async () => {
    price = price.add(1);
    await service.cycle();

    const updatedOrder = await orderRepository.findOne({ id: order.id }) as IStoredOrder;
    expect(updatedOrder.softCanceled).to.equal(false);
  });
});
