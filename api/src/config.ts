import { DefaultPriceFeed } from './services/default-price-feed';
import { PriceFeed } from './services/price-feed';

const apiKeyId = process.env['AQUEDUCT_API_KEY_ID'];
if (!apiKeyId) { throw new Error(`AQUEDUCT_API_KEY_ID env var not set`); }

export type GasPriceSetting = 'safelow' | 'standard' | 'fast';

const gasPrice = process.env['GAS_PRICE'] as GasPriceSetting;
const gasPriceSettings: GasPriceSetting[] = ['safelow', 'standard', 'fast'];
if (gasPrice && gasPriceSettings.indexOf(gasPrice) !== -1) {
  throw new Error(`GAS_PRICE must be one of ${JSON.stringify(gasPriceSettings)}`);
}

export interface IConfig {
  networkId: number;
  apiKeyId: string;
  priceFeed: PriceFeed;
  gasSetting: GasPriceSetting;
}

export const config: IConfig = {
  networkId: undefined as any,
  apiKeyId,
  priceFeed: new DefaultPriceFeed(),
  gasSetting: gasPrice || 'standard'
};
