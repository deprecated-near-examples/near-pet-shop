const { NearProvider } = require('near-web3-provider');

const NEAR_ACCOUNT_ID = 'adopter.test.near';
const NEAR_NETWORK_ID = 'default';
const NEAR_URL = 'http://34.82.212.1:3030';
const NEAR_EXPLORER_URL = '';
const NEAR_EVM = 'evm';

function NearTestNetProvider() {
  return new NearProvider({
    nodeUrl: NEAR_URL,
    networkId: NEAR_NETWORK_ID,
    masterAccountId: NEAR_ACCOUNT_ID,
    evmAccountId: NEAR_EVM,
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
