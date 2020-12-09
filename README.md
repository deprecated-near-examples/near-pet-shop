# NEAR Pet Shop

This project is based on Truffle's [Pet Shop Tutorial](https://www.trufflesuite.com/tutorials/pet-shop) but uses NEAR's custom provider called [near-web3-provider](https://github.com/nearprotocol/near-web3-provider) and deploys the Solidity contracts to the [NEAR EVM](https://github.com/near/near-evm).

You may read more about the NEAR EVM in the link above, but suffice it to say it's a smart contract written in Rust that acts as the Ethereum Virtual Machine. This means developers may compile existing Ethereum contracts and deploy them to the NEAR blockchain. The EVM contract may hold multiple Ethereum contracts with transactions operating in a synchronous manner, as opposed to native NEAR smart contracts which are asynchronous. Projects may choose to use a provided `evm` account on a given network, or deploy their own EVM contract.  

This is made possible by two NEAR libraries:

1. [near-api-js](https://www.npmjs.com/package/near-api-js): the JavaScript library used to abstract JSON RPC calls.
2. [near-web3-provider](https://www.npmjs.com/package/near-web3-provider): the web3 provider for NEAR containing utilities and Ethereum routes (ex. `eth_call`, `eth_getBlockByHash`, etc.)

This project uses Truffle for testing and migrating. Migrating, in this sense, also means deploying to an environment. Please see `truffle-config.js` for network connection details. 

## Install

    mkdir near-pet-shop
    cd near-pet-shop
    npx truffle unbox near-examples/near-pet-shop

## Get NEAR Betanet account

If you don't have a NEAR Betanet account, please create one using the Wallet interface at:
https://wallet.betanet.near.org

## Betanet migration

**Note**: for instructions on migrating to a local NEAR environment, please read [this document](Local%20EVM%20Setup.md).
    
    npx truffle migrate --network nearBetanet
    
## Start web app

    npm run betanet
    
This will run a local website. The terminal will display the URL, which is typically:
http://localhost:1234

On this site you'll see a grid of pets to adopt with corresponding **Adopt** buttons. 
  
The first time you run this app, the **Adopt** buttons will be disabled until you've logged in. Click on the **Login** button in the upper-right corner of the screen. You will be redirected to the NEAR Betanet Wallet and asked to confirm creating a function-call access key, which you'll want to allow. After allowing, you're redirected back to Pet Shop, and a special key exists in your browser's local storage.
  
Now you can adopt a pet! Once you've clicked the **Adopt** button pay attention to the top of the page, as a link to NEAR Explorer will appear. (This is similar to [etherscan](https://etherscan.io/) for Ethereum.)

### Troubleshooting

During development while changing the Solidity code, if unexpected behavior continues, consider removing the `build` folder and migrating again.
