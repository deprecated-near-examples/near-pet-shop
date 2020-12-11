const { NearProvider } = require('near-web3-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    nearLocal: {
      network_id: "*",
      skipDryRun: true,
      provider: () => new NearProvider({
        networkId: 'local',
        masterAccountId: 'test.near',
      }),
    },
    nearBetanet: {
      network_id: "*",
      skipDryRun: true,
      provider: () => new NearProvider({
        networkId: 'betanet',
        masterAccountId: process.env.NEAR_MASTER_ACCOUNT
      }),
    },
    develop: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8545
    }
  }
};
