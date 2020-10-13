# NEAR Pet Shop

This project is based on Truffle's [Pet Shop Tutorial](https://www.trufflesuite.com/tutorials/pet-shop) but uses NEAR's custom provider called [near-web3-provider](https://github.com/nearprotocol/near-web3-provider) and deploys the Solidity contracts to the [NEAR EVM](https://github.com/near/near-evm).

You may read more about the NEAR EVM in the link above, but suffice it to say it's a smart contract written in Rust that acts as the Ethereum Virtual Machine. This means developers may compile existing Ethereum contracts and deploy them to the NEAR blockchain.

### Install

    mkdir near-pet-shop
    cd near-pet-shop
    npx truffle unbox near-examples/near-pet-shop

### Compile (Optional)

    npx truffle compile

### Migrate
    
    npx truffle migrate --network nearTestnet
    
### Start web app

    npm run dev
    
You will see a grid of pets to adopt with corresponding **Adopt** buttons. Once you've clicked the button pay attention to the top of the page, as a link to NEAR Explorer will appear. (This is similar to [etherscan](https://etherscan.io/) for Ethereum.)

## Notes

There is a special key pair located in `./neardev/default/evm.demo.testnet.json`. While this contains a public and private key, this is what's known as a "function-call access key" in NEAR. That generally means this key is safe to store in this repository as there is a large gas allowance on it for method calls to deploy and call.

[More information on NEAR accounts](https://docs.near.org/docs/concepts/account).

This repository tries to maintain as much similarity as possible to the original Pet Shop. The primary goal is to demonstrate that the Pet Shop Solidity contracts can be compiled and migrated using Truffle without having to rewrite into a more native smart contract language for NEAR.

It's also worth noting that some JavaScript files (like `./src/js/app.js`) will be very similar to the Pet Shop files. This has resulted in a mix of jQuery and other dependencies, but serves as a way for developers to compare this code quite easily.  

## Troubleshooting

During development while changing the Solidity code, if unexpected behavior continues, consider removing the `build` folder and migrating again.
