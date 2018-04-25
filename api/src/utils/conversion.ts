import { BigNumber } from 'bignumber.js';

export interface IUnitAmountParams {
  token: { decimals: number };
  value: string | number | BigNumber;
}

export const toUnitAmount = (params: IUnitAmountParams) => {
  return new BigNumber(params.value).times(Math.pow(10, -params.token.decimals));
};

export const toBaseUnitAmount = (params: IUnitAmountParams) => {
  return new BigNumber(params.value).times(Math.pow(10, params.token.decimals)).round();
};

export const getAbsoluteSpread = ({ price, spreadBps }: { price: BigNumber; spreadBps: number }) => {
  return price.times(spreadBps.toString()).times(.0001);
};
