[ -z "$ETHEREUM_CHAIN" ] && echo "ETHEREUM_CHAIN must be set to 'kovan' (testnet) or 'foundation' (mainnet)" && exit 1;

# node can get stuck, this is the way to make it not be stuck
rm -rf /root/.local/share/io.parity.ethereum/chains/$ETHEREUM_CHAIN/network/nodes.json
/parity/parity --geth \
--jsonrpc-hosts all --jsonrpc-interface all \
--warp --no-ancient-blocks --no-serve-light \
--max-peers 250 --snapshot-peers 50 --min-peers 50 \
--mode active --tracing off --pruning fast \
--db-compaction ssd --cache-size 4096 \
--chain $ETHEREUM_CHAIN --base-path /root/.local/share/io.parity.ethereum/ \
--jsonrpc-apis web3,eth,personal,pubsub,net,parity,parity_accounts,parity_pubsub,traces,rpc
