export const fixture = <T, R>(op: (model: T) => Promise<R>) => async (model: T) => {
  return await op(model);
};
