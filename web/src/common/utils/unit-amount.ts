import { BigNumber } from 'bignumber.js';

interface IUnitAmountParams {
  token: { decimals: number };
  value: string | number | BigNumber;
}

export const toUnitAmount = (params: IUnitAmountParams) => {
  return new BigNumber(params.value).times(Math.pow(10, -params.token.decimals));
};

export const toBaseUnitAmount = (params: IUnitAmountParams) => {
  return new BigNumber(params.value).times(Math.pow(10, params.token.decimals)).integerValue();
};
