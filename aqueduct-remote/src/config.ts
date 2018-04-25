const apiKeyId = process.env['AQUEDUCT_API_KEY_ID'];
if (!apiKeyId) { throw new Error(`AQUEDUCT_API_KEY_ID env var not set`); }

const chain = process.env['ETHEREUM_CHAIN'];
if (!chain) {
  throw new Error(`ETHEREUM_CHAIN env var not set`);
}

if (chain !== 'foundation' && chain !== 'kovan') { throw new Error(`ETHEREUM_CHAIN must be 'foundation' or 'kovan'`); }

const networkId = chain === 'foundation' ? 1 : 42;

export const config = {
  nodeUrl: 'http://parity:8545',
  apiKeyId,
  networkId
};
