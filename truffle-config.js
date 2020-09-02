const { NearProvider } = require('near-web3-provider');

const NEAR_TESTNET_URL = 'https://rpc.testnet.near.org';
const NEAR_LOCAL_NETWORK_ID = 'default';
const NEAR_LOCAL_ACCOUNT_ID = 'evm.demo.testnet';
const NEAR_LOCAL_EVM = 'evm.demo.testnet';

function NearTestNetProvider() {
  return new NearProvider({
    nodeUrl: NEAR_TESTNET_URL,
    networkId: NEAR_LOCAL_NETWORK_ID,
    masterAccountId: NEAR_LOCAL_ACCOUNT_ID,
    evmAccountId: NEAR_LOCAL_EVM,
  });
}

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    nearTestnet: {
      network_id: "*",
      skipDryRun: true,
      provider: () => NearTestNetProvider(),
    },
    develop: {
      port: 8545
    }
  }
};
