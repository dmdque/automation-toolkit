import { BigNumber } from 'bignumber.js';
import { ITokenPair } from '../db/market-repository';
import { IOrder, IStoredOrder } from '../db/order-repository';

export interface IGetOrderPriceParams {
  order: IOrder;
  side: 'buy' | 'sell';
  baseDecimals: number;
}

export const getOrderPrice = ({ order, side, baseDecimals }: IGetOrderPriceParams) => {
  const normalizeTokenPrice = (value: BigNumber) => {
    return value.times(new BigNumber(10).pow(baseDecimals - 18));
  };

  const price = side === 'buy'
    ? new BigNumber(order.makerTokenAmount).dividedBy(new BigNumber(order.takerTokenAmount))
    : new BigNumber(order.takerTokenAmount).dividedBy(new BigNumber(order.makerTokenAmount));

  return normalizeTokenPrice(price);
};

export interface IGetOrderAttributesParams {
  side: 'buy' | 'sell';
  quantityInWei: BigNumber;
  price: BigNumber;
}

// TODO: This name is not good
export const getOrderAttributes = ({ side, quantityInWei, price }: IGetOrderAttributesParams) => {
  if (side === 'buy') {
    const takerTokenAmount = quantityInWei;
    return {
      takerTokenAmount,
      makerTokenAmount: takerTokenAmount.times(price).round()
    };
  } else {
    const makerTokenAmount = quantityInWei;
    return {
      makerTokenAmount,
      takerTokenAmount: makerTokenAmount.times(price).round()
    };
  }
};

export const getOrderSide = ({ order, tokenPair }: { order: IStoredOrder; tokenPair: ITokenPair; }) => {
  return order.makerTokenAddress === tokenPair.tokenA.address ? 'sell' : 'buy';
};
