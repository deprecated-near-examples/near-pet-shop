const { NearProvider } = require('near-web3-provider');
const BETANET_ACCOUNT_ID = '<changethis>'; // Create account at https://wallet.betanet.near.org/
const NEAR_EVM = 'evm';

function NearBetanetProvider() {
  return new NearProvider({
    nodeUrl: 'https://rpc.betanet.near.org',
    networkId: 'betanet',
    masterAccountId: BETANET_ACCOUNT_ID,
    evmAccountId: NEAR_EVM,
  });
}

function NearLocalProvider() {
  return new NearProvider({
    nodeUrl: 'http://127.0.0.1:3030',
    networkId: 'local',
    masterAccountId: 'adopter.test.near',
    evmAccountId: NEAR_EVM,
  });
}

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    nearLocal: {
      network_id: 1313161555,
      skipDryRun: true,
      provider: () => NearLocalProvider(),
    },
    nearBetanet: {
      network_id: 1313161555,
      skipDryRun: true,
      provider: () => NearBetanetProvider(),
    },
    develop: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8545
    }
  }
};
