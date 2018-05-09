const chain = process.env['ETHEREUM_CHAIN'];
if (!chain) {
  throw new Error(`ETHEREUM_CHAIN env var not set`);
}

if (chain !== 'foundation' && chain !== 'kovan') { throw new Error(`ETHEREUM_CHAIN must be 'foundation' or 'kovan'`); }

const networkId = chain === 'foundation' ? 1 : 42;

export const config = {
  nodeUrl: 'http://parity:8545',
  networkId,
  chain
};
