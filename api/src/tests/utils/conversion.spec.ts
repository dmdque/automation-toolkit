import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { getAbsoluteSpread, toBaseUnitAmount, toUnitAmount } from '../../utils/conversion';

describe('toUnitAmount', () => {
  it('should convert standard token amount correctly', () => {
    const data = [
      { input: '5000000000000000000', output: '5' },
      { input: '100000000000000000', output: '0.1' },
      { input: '66666700000000000000', output: '66.6667' }
    ];

    data.forEach(d => {
      const result = toUnitAmount({
        token: {
          decimals: 18
        },
        value: d.input
      });

      expect(result.toString()).to.equal(d.output);
    });
  });
});

describe('toBaseUnitAmount', () => {
  it('should convert standard token amount correctly', () => {
    const data = [
      { output: '5000000000000000000', input: '5' },
      { output: '100000000000000000', input: '0.1' },
      { output: '66666700000000000000', input: '66.6667' }
    ];

    data.forEach(d => {
      const result = toBaseUnitAmount({
        token: {
          decimals: 18
        },
        value: d.input
      });

      expect(result.toString()).to.equal(d.output);
    });
  });
});

describe('getAbsoluteSpread', () => {
  it('should convert amount correctly', () => {
    const data = [
      {
        input: {
          price: new BigNumber(.001),
          spreadBps: 50
        },
        output: new BigNumber(.000005)
      }
    ];

    data.forEach(d => {
      const result = getAbsoluteSpread(d.input);
      expect(result.toString()).to.equal(d.output.toString());
    });
  });
});
