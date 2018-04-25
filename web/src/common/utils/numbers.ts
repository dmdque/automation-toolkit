export const isValidFloat = (value: string) => {
  const parsedValue = parseFloat(value);
  return !isNaN(parsedValue);
};

export const isValidInt = (value: string) => {
  const parsedValue = parseInt(value, 10);
  return !isNaN(parsedValue);
};
