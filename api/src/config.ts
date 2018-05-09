import { DefaultPriceFeed } from './services/default-price-feed';
import { PriceFeed } from './services/price-feed';

export type GasPriceSetting = 'safelow' | 'standard' | 'fast';

const gasPrice = process.env['GAS_PRICE'] as GasPriceSetting;
const gasPriceSettings: GasPriceSetting[] = ['safelow', 'standard', 'fast'];
if (gasPrice && gasPriceSettings.indexOf(gasPrice) !== -1) {
  throw new Error(`GAS_PRICE must be one of ${JSON.stringify(gasPriceSettings)}`);
}

export interface IConfig {
  networkId: number;
  priceFeed: PriceFeed;
  gasSetting: GasPriceSetting;
  chain: 'kovan' | 'foundation';
}

export const config: IConfig = {
  networkId: undefined as any,
  chain: undefined as any,
  priceFeed: new DefaultPriceFeed(),
  gasSetting: gasPrice || 'standard'
};
