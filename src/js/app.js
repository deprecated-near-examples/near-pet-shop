require('regenerator-runtime/runtime');
const { NearProvider, nearlib: nearAPI } = require('near-web3-provider');
// Because we're using a function-call access key, this is the same as the NEAR_LOCAL_EVM
const NEAR_LOCAL_ACCOUNT_ID = 'evm.demo.testnet';
const NEAR_LOCAL_NETWORK_ID = 'default';
const NEAR_LOCAL_URL = 'https://rpc.testnet.near.org';
const NEAR_EXPLORER_URL = 'https://explorer.testnet.near.org';
const NEAR_LOCAL_EVM = 'evm.demo.testnet';

function NearTestNetProvider(keyStore) {
  return new NearProvider({
    nodeUrl: NEAR_LOCAL_URL,
    keyStore,
    networkId: NEAR_LOCAL_NETWORK_ID,
    masterAccountId: NEAR_LOCAL_ACCOUNT_ID,
    evmAccountId: NEAR_LOCAL_EVM,
  });
}

App = {
  web3Provider: null,
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

      petsRow.append(petTemplate.html());
    }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // This is the private key for a function-call access key on evm.demo.testnet that can call:
    //   * deploy_code
    //   * call_contract
    let privateKey = 'xvWfjvV91wLEq81nEttH3KH3ajLZS1wgeGm8gHf8oGEUseCfZzN98zqWurmZKbBfgEHbQRUbSTMS7k8idWgxFUH';
    const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    // const keyPair = KeyPair.fromString(process.env.CLIENT_KEY_PAIR)
    if (process.env.CLIENT_KEY_PAIR && App.isJSON(process.env.CLIENT_KEY_PAIR)) {
      const environmentVariableKeyPair = JSON.parse(process.env.CLIENT_KEY_PAIR);
      console.log(`Found CLIENT_KEY_PAIR environment variable with public key: ${environmentVariableKeyPair.public_key}`)
      privateKey = environmentVariableKeyPair.private_key;
    }
    const keyPair = nearAPI.KeyPair.fromString(privateKey)
    await keyStore.setKey(NEAR_LOCAL_NETWORK_ID, NEAR_LOCAL_ACCOUNT_ID, keyPair);

    App.web3Provider = NearTestNetProvider(keyStore);
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: async function() {
    // Get the necessary contract artifact file and instantiate it with @truffle/contract
    const adoptionObj = require('../../build/contracts/Adoption.json');
    App.contracts.Adoption = TruffleContract(adoptionObj);

    // Set the provider for our contract
    App.contracts.Adoption.setProvider(App.web3Provider);

    // Use our contract to retrieve and mark the adopted pets
    await App.markAdopted();

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: async function() {
    let adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));
    $('.panel-pet').eq(petId).find('button').text('Processing…').attr('disabled', true);

    let adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      const account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        const transactionId = result.tx.split(':')[0];
        const dogName = $('.panel-pet').eq(petId).find('.panel-title')[0].innerHTML;
        $('#explorer-link a').attr('href', `${NEAR_EXPLORER_URL}/transactions/${transactionId}`).text(`See ${dogName}'s adoption in NEAR Explorer`);
        console.log(`Thank you for adopting ${dogName}! 🐶🐶🐶`)
        console.log('Scroll to the top for a link to NEAR Explorer showing this transaction.')
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
  isJSON: function(val) {
    try {
      JSON.parse(val);
    } catch (e) {
      console.warn('Please check your CLIENT_KEY_PAIR environment variable.');
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
