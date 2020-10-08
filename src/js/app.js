require('regenerator-runtime/runtime');
const { NearProvider, nearAPI } = require('near-web3-provider');
const Contract = require('web3-eth-contract');
const NEAR_ACCOUNT_ID = 'adopter.test.near';
const NEAR_NETWORK_ID = 'default';
const NEAR_URL = 'http://34.82.212.1:3030';
const NEAR_EXPLORER_URL = '';
const NEAR_EVM = 'evm';
const RELAY_URL = 'http://127.0.0.1:3000'

function NearTestNetProvider(keyStore) {
  return new NearProvider({
    nodeUrl: NEAR_URL,
    keyStore,
    networkId: NEAR_NETWORK_ID,
    masterAccountId: NEAR_ACCOUNT_ID,
    evmAccountId: NEAR_EVM,
  });
}

function NearRelayProvider(keyStore) {
  return new NearProvider({
    nodeUrl: RELAY_URL,
    keyStore,
    networkId: NEAR_NETWORK_ID,
    masterAccountId: NEAR_ACCOUNT_ID,
    evmAccountId: NEAR_EVM,
  });
}

function parseSignature(signature) {
  const r = signature.substring(0, 64);
  const s = signature.substring(64, 128);
  const v = parseInt(signature.substring(128, 130), 16);

  return {
    r: "0x" + r,
    s: "0x" + s,
    v
  }
}

App = {
  nearWeb3Provider: null,
  ethWeb3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    const petsObj = require('../pets.json');
    const petsRow = $('#petsRow');

    // load individual dog images (parcel will hash filename)
    const dogNameToImage = {
      'Boxer': $('#hidden-for-parcel #template-boxer')[0].src,
      'French Bulldog': $('#hidden-for-parcel #template-french-bulldog')[0].src,
      'Golden Retriever': $('#hidden-for-parcel #template-golden-retriever')[0].src,
      'Scottish Terrier': $('#hidden-for-parcel #template-scottish-terrier')[0].src
    }

    const petTemplate = $('#petTemplate');

    for (let i = 0; i < petsObj.length; i ++) {
      petTemplate.find('.panel-title').text(petsObj[i].name);
      petTemplate.find('img').attr('src', dogNameToImage[petsObj[i].breed]);
      petTemplate.find('.pet-breed').text(petsObj[i].breed);
      petTemplate.find('.pet-age').text(petsObj[i].age);
      petTemplate.find('.pet-location').text(petsObj[i].location);
      petTemplate.find('.btn-adopt').attr('data-id', petsObj[i].id);
      petTemplate.find('.btn-sign').attr('data-id', petsObj[i].id);

      petsRow.append(petTemplate.html());
    }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // This is the private key for a function-call access key on evm.demo.testnet that can call:
    //   * deploy_code
    //   * call_contract
    let privateKey = '4aTwGQUFp6MfLi3BKDyjVHpWzsB7UfdfmcXTfZ39834nodyYmUnzRkzprXjWLdVRzgnjaueM35peVdEduznJskWY';
    const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    if (process.env.CLIENT_KEY_PAIR && App.isJSON(process.env.CLIENT_KEY_PAIR)) {
      const environmentVariableKeyPair = JSON.parse(process.env.CLIENT_KEY_PAIR);
      console.log(`Found CLIENT_KEY_PAIR environment variable with public key: ${environmentVariableKeyPair.public_key}`)
      privateKey = environmentVariableKeyPair.private_key;
    }
    const keyPair = nearAPI.KeyPair.fromString(privateKey)
    await keyStore.setKey(NEAR_NETWORK_ID, NEAR_ACCOUNT_ID, keyPair);

    App.nearWeb3Provider = NearTestNetProvider(keyStore); // old one
    App.nearRelayWeb3Provider = NearRelayProvider(keyStore);
    App.ethWeb3Provider = window.ethereum;
    nearWeb3 = new Web3(App.nearWeb3Provider);
    nearRelayWeb3 = new Web3(App.nearRelayWeb3Provider);
    ethWeb3 = new Web3(App.ethWeb3Provider);

    return App.initContract();
  },

  initContract: async function() {
    // Get the necessary contract artifact file and instantiate it with @truffle/contract
    const adoptionObj = require('../../build/contracts/Adoption.json');
    const networkId = App.nearWeb3Provider.version;
    const address = adoptionObj.networks[networkId].address;
    App.contracts.Adoption = new Contract(adoptionObj.abi, address, {
      from: address
    });

    // Use our contract to retrieve and mark the adopted pets
    await App.markAdopted();
    return App.bindEvents();
  },

  getNonce: async function(ethAccountId) {
    return await new Promise((resolve, reject) => {
      nearWeb3.eth.getTransactionCount(ethAccountId, function (error, nonce) {
        if (error) {
          reject(error);
        }
        resolve(nonce);
      });
    });
  },

  getAccounts: async function(web3) {
    return await new Promise((resolve, reject) => {
      web3.eth.getAccounts(function (error, accounts) {
        if (error) {
          reject(error);
        }
        resolve(accounts);
      });
    });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-sign', App.handleSign);
  },

  markAdopted: async function() {
    // Set provider to be our provider, as this is a "view" call
    App.contracts.Adoption.setProvider(App.nearWeb3Provider);

    const getAdoptersInstance = await App.contracts.Adoption.methods.getAdopters.call();
    // Unclear why I must do a second call here
    const adopters = await getAdoptersInstance.call();
    adopters.forEach((adopter, i) => {
      if (adopter !== '0x0000000000000000000000000000000000000000') {
        $('.panel-pet').eq(i).find('button.btn-sign').hide();
        $('.panel-pet').eq(i).find('button.btn-adopt').text('Success').attr('disabled', true);
      }
    });
  },

  handleAdopt: async function(event) {
    event.preventDefault();

    App.contracts.Adoption.setProvider(App.nearWeb3Provider);
    // const test = await nearWeb3.eth.getAccounts();

    const petId = parseInt($(event.target).data('id'));
    $('.panel-pet').eq(petId).find('button.btn-sign').hide();
    $('.panel-pet').eq(petId).find('button.btn-adopt').text('Processing…').attr('disabled', true);

    const accounts = await App.getAccounts(nearWeb3);
    const account = accounts[0];

    const adoptionResult = await App.contracts.Adoption.methods.adopt(petId).send({from: account});
    console.log('adoptionResult from NEAR', adoptionResult)
    const transactionId = adoptionResult.transactionHash.split(':')[0];
    const dogName = $('.panel-pet').eq(petId).find('.panel-title')[0].innerHTML;
    $('#explorer-link a').attr('href', `${NEAR_EXPLORER_URL}/transactions/${transactionId}`).text(`See ${dogName}'s adoption in NEAR Explorer`);
    console.log(`Thank you for adopting ${dogName}! 🐶🐶🐶`)
    console.log('Scroll to the top for a link to NEAR Explorer showing this transaction.')
    return App.markAdopted();
  },

  handleSign: async function(event) {
    event.preventDefault();
    const accounts = await App.getAccounts(nearWeb3);
    const account = accounts[0];
    const nonce = await App.getNonce(account);
    console.log(`Account ${account} has nonce ${nonce}`);

    const petId = parseInt($(event.target).data('id'));
    const dogName = $('.panel-pet').eq(petId).find('.panel-title')[0].innerHTML;

    if (ethWeb3.eth.accounts[0] == null) {
      $('#status-messages')[0].innerHTML = 'Opening MetaMask…';
      try {
        await ethWeb3.currentProvider.enable();
      } catch (e) {
        $('#status-messages')[0].innerHTML = `Issue with MetaMask: "${e.message}"`;
        console.error(e);
      }
    }

    $('#status-messages')[0].innerHTML = 'Waiting for signature approval…';

    // TODO: modify this to add NearTx structure
    // NearTx(string evmId, uint256 nonce, address contractAddress, bytes arguments)
    // See: nearcore/runtime/near-evm-runner/src/utils.rs
    const domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
    ];

    const adoption = [
      { name: "dogName", type: "string" },
    ]

    const chainId = parseInt(ethWeb3.version.network, 10);

    const domainData = {
      name: "NEAR",
      version: "1",
      chainId: chainId,
    };

    const message = {
      amount: 6,
      tokenAddress: "0x000000000000000000000000000000000000NEAR",
      dogName,
      contractMethod: "adopt"
    };

    const data = JSON.stringify({
      types: {
        EIP712Domain: domain,
        Adoption: adoption,
      },
      domain: domainData,
      primaryType: "Adoption",
      message: message
    });

    const signer = ethWeb3.toChecksumAddress(ethWeb3.eth.accounts[0]);

    ethWeb3.currentProvider.sendAsync(
      {
        method: "eth_signTypedData_v4",
        params: [signer, data],
        from: signer
      },
      function(err, result) {
        if (err || result.error) {
          $('#status-messages')[0].innerHTML = `User cancelled signature: "${result.error.message}"`;
          return console.error(result);
        }

        const signature = parseSignature(result.result.substring(2));

        const res = $('#response')[0];
        res.innerHTML = `Signature:<br/>r: ${signature.r}<br/>s: ${signature.s}<br/>v: ${signature.v}`;
        $('#status-messages')[0].innerHTML = '';
        console.log('signature', signature);

        const postData = {
          data,
          signature
        };

        $.post(RELAY_URL, postData)
          .done( function( data ) {
            console.log('data', data);
          res.html = data;
        });
      }
    );
  },
  isJSON: function(val) {
    try {
      JSON.parse(val);
    } catch (e) {
      return false;
    }
    return true;
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
