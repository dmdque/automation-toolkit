export const isValidFloat = (value: string) => {
  const parsedValue = parseFloat(value);
  return !isNaN(parsedValue);
};
