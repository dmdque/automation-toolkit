[ -z "$ETHEREUM_CHAIN" ] && echo "ETHEREUM_CHAIN must be set to 'kovan' (testnet) or 'foundation' (mainnet)" && exit 1;
[ -z "$AQUEDUCT_API_KEY_ID" ] && echo "AQUEDUCT_API_KEY_ID must be set to a valid Aqueduct API key" && exit 1;

# node can get stuck, this is the way to make it not be stuck
rm -rf /root/.local/share/io.parity.ethereum/chains/$ETHEREUM_CHAIN/network/nodes.json
/parity/parity --geth --force-ui --unsafe-expose --chain $ETHEREUM_CHAIN --base-path /root/.local/share/io.parity.ethereum/ --jsonrpc-apis web3,eth,personal,pubsub,net,parity,parity_pubsub,traces,rpc
