import { DefaultPriceFeed } from './services/default-price-feed';
import { PriceFeed } from './services/price-feed';

const apiKeyId = process.env['AQUEDUCT_API_KEY_ID'];
if (!apiKeyId) { throw new Error(`AQUEDUCT_API_KEY_ID env var not set`); }

export interface IConfig {
  networkId: number;
  apiKeyId: string;
  priceFeed: PriceFeed;
}

export const config: IConfig = {
  networkId: undefined as any,
  apiKeyId,
  priceFeed: new DefaultPriceFeed()
};
