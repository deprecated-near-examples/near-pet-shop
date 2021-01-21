require('regenerator-runtime/runtime');
const { nearAPI, utils, NearProvider } = require('near-web3-provider');
const Contract = require('web3-eth-contract');
const Web3 = require('web3');

App = {
  nearWeb3Provider: null,
  ethWeb3Provider: null,
  contracts: {},
  adoptionAddress: null,
  isLoggedIn: false,
  nearNetwork: process.env.NEAR_ENV,
  nearNetworkDefaults: utils.getNetworkConfig(process.env.NEAR_ENV),
  networkConfig: null,
  walletConnection: null,
  account: null,

  init: async function() {
    // Need to set up WalletConnection and then networkConfig
    const near = await nearAPI.connect(Object.assign({ keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore() }, this.nearNetworkDefaults));
    App.walletConnection = new nearAPI.WalletConnection(near);
    this.isLoggedIn = App.walletConnection.getAccountId() !== '';

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
      if (!this.isLoggedIn) {
        petTemplate.find('.btn-adopt').attr('disabled', 'disabled');
      } else {
        $('#status-messages')[0].innerHTML = '';
        $('.btn-login').addClass('logged-in');
        $('.btn-login')[0].innerText = 'Clear session';
      }

      petsRow.append(petTemplate.html());
    }

    if (!this.isLoggedIn) {
      $('#status-messages')[0].innerHTML = 'Please log in to NEAR Wallet…';
      $('.btn-clear').attr('disabled', 'disabled');
    }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (this.isLoggedIn) {
      App.networkConfig = new NearProvider({
        networkId: this.nearNetwork,
        masterAccountId: App.walletConnection.getAccountId(),
        keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      });
    } else {
      App.networkConfig = new NearProvider({
        networkId: this.nearNetwork,
        keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
        isReadOnly: true
      });
    }

    App.nearWeb3Provider = App.networkConfig;
    App.ethWeb3Provider = window.ethereum;
    nearWeb3 = new Web3(App.nearWeb3Provider);
    ethWeb3 = new Web3(App.ethWeb3Provider);

    if (this.isLoggedIn) {
      const accounts = await App.getAccounts(nearWeb3);
      if (accounts.length) {
        this.account = accounts[accounts.length - 1];
      } else {
        $('#status-messages')[0].innerHTML = 'Issue finding accounts…';
        return;
      }
    }

    return await App.initContract();
  },

  initContract: async function() {
    // Get the necessary contract artifact file and instantiate it with @truffle/contract
    const adoptionObj = require('../../build/contracts/Adoption.json');
    const networkId = App.nearWeb3Provider.version;
    if (adoptionObj.networks[networkId]) {
      App.adoptionAddress = adoptionObj.networks[networkId].address;
    } else {
      console.error('Could not find the contract address in Adoption.json, please make sure you\'ve followed the README in deploying the contract to the specified network.');
      return;
    }
    App.contracts.Adoption = new Contract(adoptionObj.abi, App.adoptionAddress, {
      from: App.adoptionAddress
    });
    App.contracts.Adoption.setProvider(App.nearWeb3Provider);

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
    $(document).on('click', '.btn-login', App.handleLogin);
    $(document).on('click', '.btn-clear', App.handleClear);
  },

  markAdopted: async function() {
    // Set provider to be our provider, as this is a "view" call
    const adopters = await App.contracts.Adoption.methods.getAdopters().call();
    adopters.forEach((adopter, i) => {
      if (adopter !== '0x0000000000000000000000000000000000000000') {
        $('.panel-pet').eq(i).find('button.btn-sign').hide();
        $('.panel-pet').eq(i).find('button.btn-adopt').text('Success').attr('disabled', true);
      }
    });
  },

  handleClear: async function() {
    event.preventDefault();
    $(event.target).attr('disabled', true);
    await App.contracts.Adoption.methods.clear().send({from: App.account});
    window.location.reload(false);
  },

  handleLogin: async function(event) {
    event.preventDefault();

    // User clicked "Clear session"
    if ($('.btn-login').hasClass('logged-in')) {
      localStorage.clear();
      window.location.reload(false);
    }

    if (App.walletConnection.getAccountId() === '') {
      // User needs to log in
      App.walletConnection.requestSignIn(App.nearNetworkDefaults.evmAccountId);
    } else {
      App.networkConfig.accountId = App.walletConnection.getAccountId();
    }
  },

  handleAdopt: async function(event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));
    $('.panel-pet').eq(petId).find('button.btn-sign').hide();
    $('.panel-pet').eq(petId).find('button.btn-adopt').text('Processing…').attr('disabled', true);

    const adoptionResult = await App.contracts.Adoption.methods.adopt(petId).send({from: App.account});
    const transactionId = adoptionResult.transactionHash.split(':')[0];
    const dogName = $('.panel-pet').eq(petId).find('.panel-title')[0].innerHTML;
    $('#explorer-link a').attr('href', `${App.networkConfig.explorerUrl}/transactions/${transactionId}`).text(`See ${dogName}'s adoption in NEAR Explorer`);
    console.log(`Thank you for adopting ${dogName}! 🐶🐶🐶`)
    console.log('Scroll to the top for a link to NEAR Explorer showing this transaction.')
    return App.markAdopted();
  },

  handleSign: async function(event) {
    event.preventDefault();

    const accounts = await App.getAccounts(nearWeb3);
    const account = accounts[0];
    const nonce = await App.getNonce(account);

    const petId = parseInt($(event.target).data('id'));

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

    // With the custom RPC endpoint, chainId will be parseInt(nearWeb3.currentProvider.version, 10);
    const chainId = 1;

    const data = JSON.stringify({
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        Arguments: [
          { name: "petId", type: "uint256" },
        ],
        NearTx: [
          { name: "evmId", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "feeAmount", type: "uint256" },
          { name: "feeAddress", type: "address" },
          { name: "contractAddress", type: "address" },
          { name: "contractMethod", type: "string" },
          { name: "arguments", type: "Arguments" },
        ]
      },
      primaryType: "NearTx",
      domain: {
        name: "NEAR",
        version: "1",
        chainId: chainId,
      },
      message: {
        evmId: App.networkConfig.evm_contract,
        nonce,
        feeAmount: '6',
        feeAddress: '0x0000000000000000000000000000000000000000',
        contractAddress: App.adoptionAddress,
        contractMethod: 'adopt(uint256)',
        arguments: {
            petId,
        }
      }
    });

    const signer = ethWeb3.toChecksumAddress(ethWeb3.eth.accounts[0]);
    ethWeb3.currentProvider.sendAsync({
        method: "eth_signTypedData_v4",
        params: [signer, data],
        from: signer
      },
      function(err, result) {
        if (err || result.error) {
          $('#status-messages')[0].innerHTML = `User cancelled signature: "${result.error.message}"`;
          return console.error(result);
        }
        const signature = result.result.substr(2);
        const res = $('#response')[0];
        console.log(`Signature: ${signature}`);
        $('#status-messages')[0].innerHTML = '';

        const postData = {
          data,
          signature
        };

        if (!process.env.NEAR_RELAY_URL) {
          $('#status-messages')[0].innerHTML = 'Did not find NEAR_RELAY_URL. Please see README.';
        }

        $.post(process.env.NEAR_RELAY_URL, postData)
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
