import { Bot, IBotParams } from '../bot/bot';

export const config: IBotParams = {
  account: '0x00be81aeb2c6b82c68123f49b4bf983224124ada',
  baseSymbol: 'MKR',
  quoteSymbol: 'WETH',
  expirationSeconds: 1800,
  layers: 20,
  spreadMaxPercent: 1,
  spreadMinPercent: .5,
  networkId: 42,
  baseReserve: 10,
  quoteReserve: 3
};

new Bot(config).start();
