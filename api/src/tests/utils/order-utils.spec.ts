import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { IOrder } from '../../db/order-repository';
import { getOrderAttributes, getOrderPrice } from '../../utils/order-utils';

describe('getOrderPrice', () => {
  describe('standard token decimals', () => {
    it('should calculate buy price correctly', () => {
      const order = {
        makerTokenAmount: '1296264649400000000',
        takerTokenAmount: '799226000000000000000'
      } as IOrder;

      const price = getOrderPrice({
        order,
        side: 'buy',
        baseDecimals: 18
      });
      expect(price.toString()).to.equal('0.0016219');
    });

    it('should calculate sell price correctly', () => {
      const order = {
        makerTokenAmount: '328700000000000000000',
        takerTokenAmount: '551229900000000000'
      } as IOrder;

      const price = getOrderPrice({
        order,
        side: 'sell',
        baseDecimals: 18
      });
      expect(price.toString()).to.equal('0.001677');
    });
  });

  describe('non-standard token decimals', () => {
    it('should calculate buy price correctly', () => {
      const order = {
        makerTokenAmount: '228759531900000000',
        takerTokenAmount: '39448100000'
      } as IOrder;

      const price = getOrderPrice({
        order,
        side: 'buy',
        baseDecimals: 8
      });
      expect(price.toString()).to.equal('0.0005799');
    });

    it('should calculate sell price correctly', () => {
      const order = {
        makerTokenAmount: '10947800000',
        takerTokenAmount: '67328970000000000'
      } as IOrder;

      const price = getOrderPrice({
        order,
        side: 'sell',
        baseDecimals: 8
      });
      expect(price.toString()).to.equal('0.000615');
    });
  });
});

describe('getOrderAttributes', () => {
  it ('should calculate attributes for sell side', () => {
    const result = getOrderAttributes({
      side: 'sell',
      price: new BigNumber('0.00171'),
      quantityInWei: new BigNumber('5000000000000000000000')
    });

    expect(result.makerTokenAmount.toString()).to.equal('5000000000000000000000');
    expect(result.takerTokenAmount.toString()).to.equal('8550000000000000000');
  });

  it ('should calculate attributes for buy side', () => {
    const result = getOrderAttributes({
      side: 'buy',
      price: new BigNumber('0.0016219'),
      quantityInWei: new BigNumber('799226000000000000000')
    });

    expect(result.makerTokenAmount.toString()).to.equal('1296264649400000000');
    expect(result.takerTokenAmount.toString()).to.equal('799226000000000000000');
  });
});
