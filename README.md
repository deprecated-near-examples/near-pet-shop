# NEAR Pet Shop

This project is based on Truffle's [Pet Shop Tutorial](https://www.trufflesuite.com/tutorials/pet-shop) but uses NEAR's custom provider called [near-web3-provider](https://github.com/nearprotocol/near-web3-provider) and deploys the Solidity contracts to the [NEAR EVM](https://github.com/near/near-evm).

You may read more about the NEAR EVM in the link above, but suffice it to say it's a smart contract written in Rust that acts as the Ethereum Virtual Machine. This means developers may compile existing Ethereum contracts and deploy them to the NEAR blockchain.

This is made possible by two NEAR libraries:

1. [near-api-js](https://www.npmjs.com/package/near-api-js): the JavaScript library used to abstract JSON RPC calls.
2. [near-web3-provider](npmjs.com/package/near-web3-provider): the web3 provider for NEAR containing utilities and Ethereum routes (ex. `eth_call`, `eth_getBlockByHash`, etc.)

This project uses Truffle for testing and migrating. Migrating, in this sense, also means deploying to an environment. Please see `truffle-config.js` for network connection details. 

### Install

    mkdir near-pet-shop
    cd near-pet-shop
    npx truffle unbox near-examples/near-pet-shop

### Compile (Optional)

    npx truffle compile

## Betanet migration

**Note**: instructions for migrating to a local NEAR node comes later in this document.
    
    npx truffle migrate --network nearBetanet
    
### Start web app

    npm run betanet
    
This will run a local website. The terminal will display the URL, which is typically http://localhost:1234
    
---

#### 1. Get NEAR Betanet account

If you don't have a NEAR Betanet account, please create one using the Wallet interface at:
https://wallet.betanet.near.org

#### 2. Login with Pet Shop

Return to the locally hosted website for Pet Shop. You will see a grid of pets to adopt with corresponding **Adopt** buttons. 
  
  The first time you run this app, the **Adopt** buttons will be disabled until you've logged in. Click on the **Login** button in the upper-right part of the screen. You will be redirected to the NEAR Betanet Wallet and asked to confirm creating a function-call access key, which you'll want to allow. After allowing, you're redirected back to Pet Shop, and a special key exists in your browser's local storage.
   
#### 3. Adopt
  
  Now you can adopt a pet! Once you've clicked the **Adopt** button pay attention to the top of the page, as a link to NEAR Explorer will appear. (This is similar to [etherscan](https://etherscan.io/) for Ethereum.)

---

## Local setup and migration

This section covers how to try the NEAR EVM on a local node. Note, this will take longer and require more resources from your computer than using Betanet. This is for those who prefer to develop everything locally.

### Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Docker](https://docs.docker.com/get-docker/).
- NodeJS version 12+. We recommend using [a version manager](https://nodejs.org/en/download/package-manager/).
- [Python 3](https://www.python.org/download/releases/3.0/) and the [pip3 package](https://pip.pypa.io/en/stable/installing/)
- [Postgres](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
- Rust (see instructions below)

### Get Rust

    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    
Follow instructions that appear after that command, then:

    rustup target add wasm32-unknown-unknown
    
**Note**: this custom target is not strictly needed for running a nearcore node, but is needed for building smart contracts in Rust. It will be needed later in this guide.    

Also, [see the docs](https://docs.near.org/docs/tutorials/intro-to-rust#3-step-rust-installation) for more links and resources for installing Rust.

### Set up NEAR node

Clone the [nearcore repository](https://github.com/near/nearcore) with:

    git clone git@github.com:near/nearcore.git
    
Navigate to the project root:

    cd nearcore
    
Build (this will take a while, feel free to move on to future steps while this is happening):

    cargo build -p neard --release --features protocol_feature_evm,nightly_protocol_features

When the build is complete, initialize with:

    ./target/release/neard --home=$HOME/.near/local init
    
Then run:

    ./target/release/neard --home=$HOME/.near/local run

**Note**: hit Ctrl + C to stop the local node. If you want to pick up where you left off, just use this final "run" command again. If you'd like to start from scratch, remove the folder:

    rm -rf ~/.near/local
    
and then use the "initialize" and "run" commands.

### Postgres

Make sure Postgres is installed on your machine. The directions will vary per operating system and setup. As mentioned earlier, here is a link to [detailed installation guides](https://wiki.postgresql.org/wiki/Detailed_installation_guides).

Mac users may consider:

    brew install postgresql
    
and/or getting the [Postgres app](https://postgresapp.com/).

**Note**: it's worth double-checking [the README](https://github.com/near/near-contract-helper#create-database) for `near-contract-helper` if issues arise regarding the database.

Once Postgres is installed, type:

    psql
    
Make sure it takes you to a prompt. If it does not, please follow the directions given on screen. Once the prompt appears as expected you may exit with:

    \q

### NEAR Contract Helper

Clone the [NEAR Contract Helper repository](https://github.com/near/near-contract-helper)

    git clone git@github.com:near/near-contract-helper.git
    cd near-contract-helper

On your terminal / command prompt:

    psql

at the Postgres prompt:

    create user helper with superuser password 'helper';
    create database accounts_development with owner=helper;
    
Then:

    yarn migrate
    # or
    npm run migrate
    
Add a file named `.env` in the project root with these contents. We'll modify them later:

```dotenv
ACCOUNT_CREATOR_KEY={"account_id":"test.near","public_key":"ed25519:7PGseFbWxvYVgZ89K1uTJKYoKetWs7BJtbyXDzfbAcqX","secret_key":"ed25519:3D4YudUQRE39Lc4JHghuB5WM8kbgDDa34mnrEP5DdTApVH81af7e2dWgNPEaiQfdJnZq1CNPp5im4Rg5b733oiMP"}
MAIL_HOST=smtp.ethereal.email
MAIL_PASSWORD=
MAIL_PORT=587
MAIL_USER=
NEW_ACCOUNT_AMOUNT=10000000000000000000000000
NODE_ENV=development # Node.js environment; either `development` or `production`
NODE_URL=http://127.0.0.1:3030 # from ~/.near/config.json#rpc.addr – for production, use https://rpc.testnet.near.org
PORT=3000 # Used internally by the contract helper; does not have to correspond to the external IP or DNS name and can link to a host machine running the Docker container
TWILIO_ACCOUNT_SID= # account SID from Twilio (used to send security code)
TWILIO_AUTH_TOKEN= # auth token from Twilio (used to send security code)
TWILIO_FROM_PHONE=+15553455 # phone number from which to send SMS with security code (international format, starting with `+`)
WALLET_URL=http://127.0.0.1:4000
INDEXER_DB_CONNECTION=postgres://helper:helper@127.0.0.1/near_indexer_for_wallet_localnet?ssl=require
```

We will be changing the first key in the list of environment variables (`ACCOUNT_CREATOR_KEY`) to be unique to your set up. Note that there are no spaces in that key, even after colons and commas. This is important to remember as we add in your local node's private key.

As mentioned earlier in the `nearup` section, we have the private key for the localnet account **test.near**. With your preferred editor, open the file: 
 
    ~/.near/local/validator_key.json
    
Remove all spaces and line breaks such that the private key exists on one line. (Also, see the example from the code block above.) Now replace the value for the key `ACCOUNT_CREATOR_KEY` with your private key.

Finally, start the NEAR Contract Helper with:

    npm run start
    
### NEAR CLI

Future steps will use the NEAR command-line interface tool to deploy and send NEAR tokens (Ⓝ) to an account. The CLI is capable of much more than that, as [documented here](https://docs.near.org/docs/development/near-cli).

Install with:

    npm i -g near-cli

### NEAR Linkdrop

There's a smart contract called Linkdrop that will need to be deployed to the `test.near` account that was created automatically after starting the node in previous steps.

Clone the [NEAR Linkdrop](https://github.com/near/near-linkdrop) repository:

    git clone git@github.com:near/near-linkdrop.git
    cd near-linkdrop
    ./build.sh
    
We can see that there is no contract deployed to `test.near` by observing the output of this command:

    NEAR_ENV=local near state test.near

```
…
Account test.near
{
  …
  code_hash: '11111111111111111111111111111111',
  …
}
```

The `code_hash` here of all 1's signals that there is no smart contract deployed to it.

Deploy the linkdrop contract with:

    NEAR_ENV=local near deploy --accountId test.near --wasmFile res/linkdrop.wasm --keyPath ~/.near/local/validator_key.json

Now the contract has been deployed. Checking the state of the account (using the same command from before) will show the `code_hash` is now the has of the contract code.

### NEAR Wallet

Clone the [NEAR Wallet](https://github.com/near/near-wallet) repository.

    git clone git@github.com:near/near-wallet.git
    cd near-wallet
    
Create a file in the project root called `.env.local` and paste the contents:

```dotenv
REACT_APP_ACCOUNT_HELPER_URL=http://localhost:3000
REACT_APP_ACCOUNT_ID_SUFFIX=test.near
REACT_APP_IS_MAINNET=false
REACT_APP_NODE_URL=http://localhost:3030
REACT_APP_ACCESS_KEY_FUNDING_AMOUNT="3000000000000000000000000"
```

Then run this command:

    npm run update:static && node --max-http-header-size=16000 ./node_modules/.bin/parcel -p 4000 src/index.html
    
Open up the Wallet at http://127.0.0.1:4000

Follow the instructions in the interface to create an account. When asked to choose a recovery option, choose the **Email Recovery** option. When it asks for an email, enter this mock email:

    near@example.com
    
An email has not been sent, but it will appear in the logs of our Terminal tab running NEAR Contract Helper. Navigate to that tab and search for the email address. There will be a line close to that vicinity that says:

>Confirm your activation code to finish creating your account

Below there will appear a message like this:

```
…
'1. Confirm your activation code to finish creating your account:\n' +
    '154005\n' +
…
```

Copy the code (it's several digits, in the snippet above it would be `154005`) and use that to answer the prompt in Wallet for the activation code.

The next screen asks to fund an implicit account with at least 3 Ⓝ. Copy the address and
fund the account with NEAR CLI, replacing the long implicit account below with yours:

    NEAR_ENV=local near send test.near f81247b9492b80284fa2d90dc498153258a6f08e39db6cfa3356abb43a515432 500 --keyPath ~/.near/local/validator_key.json

Expect to see your user "logged in" in the upper right part of the interface. A screen may ask if you'd like to enable two-factor authentication, but we'll leave the contract as-is. 

---

### NEAR Explorer

Prerequisite: [Docker](https://docs.docker.com/get-docker/).

Clone the [NEAR Explorer](https://github.com/near/near-explorer) repository with:

    git clone git@github.com:near/near-explorer.git
    cd near-explorer

We'll use Docker to run WAMP routing:

    docker-compose build wamp
    docker-compose up -d wamp
    
Then go into the `backend` directory and create a `db` subdirectory.

    cd backend
    npm install
    mkdir db
    
Start the backend with: 
    
    env NEAR_RPC_URL=http://127.0.0.1:3030 WAMP_NEAR_EXPLORER_URL=ws://localhost:8080/ws WAMP_NEAR_EXPLORER_BACKEND_SECRET=back npm run start
    
You can expect to see your screen show logs repeating these type of messages:

```
…
Starting regular data stats check from LEGACY_SYNC_BACKEND...
Regular data stats check from LEGACY_SYNC_BACKEND is completed.
Starting regular final timestamp check...
Regular final timestamp check is completed.
Starting regular node status check...
Regular node status check is completed.
…
```

Go into the `frontend` directory:

    cd ..
    cd frontend
    npm install
    
Start the frontend on port 3019:

    env WAMP_NEAR_EXPLORER_URL=ws://localhost:8080/ws ./node_modules/.bin/next -p 3019

Then visit the frontend at http://127.0.0.1:3019

---

Lastly, we'll migrate (build and deploy) the Pet Shop to our local node and be able to use the various services we now have running.

Navigate your terminal or command prompt back to the Pet Shop directory.

## Copy key to Pet Shop

Each localnet will have it's own unique key for the account `test.near` which is created. Copy that file into the project following the keystore naming convention:

    cp ~/.near/local/validator_key.json ./neardev/local/test.near.json

## Localnet migration
    
    npx truffle migrate --network nearLocal
    
### Start web app

    npm run local
    
Open the local site at: http://localhost:1234 and begin interacting and adopting pets.

## Notes

This repository tries to maintain as much similarity as possible to the original Pet Shop. The primary goal is to demonstrate that the Pet Shop Solidity contracts can be compiled and migrated using Truffle without having to rewrite into a more native smart contract language for NEAR.

It's also worth noting that some JavaScript files (like `./src/js/app.js`) will be very similar to the Pet Shop files. This has resulted in a mix of jQuery and other dependencies, but serves as a way for developers to compare this code quite easily.  

## Troubleshooting

During development while changing the Solidity code, if unexpected behavior continues, consider removing the `build` folder and migrating again.

If you are running into issues with your localnet, you may consider deleting the `~/.near/local` directory and running the nearcore build command again.

If you're running into issues while running Explorer with messages seem to be database related, try running the command a couple more times or until the same log messages appear after each run.

If Wallet seems to be acting up, and the console log shows messages about old accounts, you may try to clear the local storage. In the browser's developer console: 

    localStorage.clear()
