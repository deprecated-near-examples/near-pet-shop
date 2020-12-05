const { NearProvider } = require('near-web3-provider');
const NEAR_NETWORK = process.env.NEAR_NETWORK;

export function getConfig(keyStore) {
  switch (NEAR_NETWORK) {
    case 'testnet':
      return {
        provider: new NearProvider({
          nodeUrl: 'https://rpc.testnet.near.org', // url
          keyStore,
          networkId: 'default', // networkId
          masterAccountId: 'test.near', // accountId
          evmAccountId: 'evm', // evm_contract
        }),
        sites: {
          walletUrl: 'https://wallet.testnet.near.org',
          explorerUrl: 'https://explorer.testnet.near.org',
        }
      };
    case 'betanet':
      return {
        provider: new NearProvider({
          nodeUrl: 'https://rpc.betanet.near.org',
          keyStore,
          networkId: 'betanet',
          masterAccountId: 'test.near',
          evmAccountId: 'evm',
        }),
        sites: {
          walletUrl: 'https://wallet.testnet.near.org',
          explorerUrl: 'https://explorer.testnet.near.org',
        }
      };
    case 'local':
      return {
        provider: new NearProvider({
          nodeUrl: 'http://127.0.0.1:3030',
          keyStore,
          networkId: 'local',
          masterAccountId: 'test.near',
          evmAccountId: 'evm',
        }),
        sites: {
          walletUrl: 'http://127.0.0.1:4000',
          explorerUrl: 'http://127.0.0.1:3019',
        }
      };
    default:
      throw Error(`Unconfigured environment '${NEAR_NETWORK}'. Please see project README.`);
  }
}
