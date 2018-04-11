import { Dashboard } from 'api/api';

export class TokenPairStore {
  public tokenPairs: Dashboard.Api.ITokenPair[];

  public async initialize() {
    this.tokenPairs = await new Dashboard.Api.TokenPairsService().get();
  }
}

export const tokenPairStore = new TokenPairStore();
