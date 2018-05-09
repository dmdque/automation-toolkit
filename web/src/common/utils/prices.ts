export const getAbsoluteSpread = (price: BigNumber, bps: number) => {
  return price.times(bps.toString()).times(.0001);
};
