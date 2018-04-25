export const shouldThrow = async (fn: () => Promise<any>) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }

  throw new Error('did not throw');
};
