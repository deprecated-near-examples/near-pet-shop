require('regenerator-runtime/runtime');
const { nearAPI, consts } = require('near-web3-provider');
const Contract = require('web3-eth-contract');
const { getConfig } = require('./config');

App = {
  nearWeb3Provider: null,
  ethWeb3Provider: null,
  contracts: {},
  adoptionAddress: null,
  nearNetwork: process.env.NEAR_NETWORK,
  networkConfig: null,
  walletConnection: null,

  init: async function() {
    // Need to set up WalletConnection and then networkConfig
    App.networkConfig = getConfig(new nearAPI.keyStores.BrowserLocalStorageKeyStore());
    const nearConfig = {
      networkId: App.networkConfig.provider.networkId,
      nodeUrl: App.networkConfig.provider.url,
      contractName: App.networkConfig.provider.evm_contract,
      walletUrl: App.networkConfig.sites.walletUrl,
      explorerUrl: App.networkConfig.sites.explorerUrl,
    };
    const near = await nearAPI.connect(Object.assign({ keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore() }, nearConfig));
    App.walletConnection = new nearAPI.WalletConnection(near);

    const isLoggedIn = App.walletConnection.getAccountId() !== '';

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
      if (!isLoggedIn) {
        petTemplate.find('.btn-adopt').attr('disabled', 'disabled');
        $('#status-messages')[0].innerHTML = 'Please log in to NEAR Wallet…';
      } else {
        $('#status-messages')[0].innerHTML = '';
        $('.btn-login').hide();
      }

      petsRow.append(petTemplate.html());
    }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    App.nearWeb3Provider = App.networkConfig.provider;
    App.ethWeb3Provider = window.ethereum;
    nearWeb3 = new Web3(App.nearWeb3Provider);
    ethWeb3 = new Web3(App.ethWeb3Provider);

    return App.initContract();
  },

  initContract: async function() {
    // Get the necessary contract artifact file and instantiate it with @truffle/contract
    const adoptionObj = require('../../build/contracts/Adoption.json');
    const networkId = App.nearWeb3Provider.version;
    App.adoptionAddress = adoptionObj.networks[networkId].address;
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
  },

  markAdopted: async function() {
    // Set provider to be our provider, as this is a "view" call
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

  handleLogin: async function(event) {
    event.preventDefault();

    if (App.walletConnection.getAccountId() === '') {
      // User needs to log in
      App.walletConnection.requestSignIn(App.networkConfig.provider.evm_contract);
    } else {
      App.networkConfig.provider.accountId = App.walletConnection.getAccountId();
    }
  },

  handleAdopt: async function(event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));
    $('.panel-pet').eq(petId).find('button.btn-sign').hide();
    $('.panel-pet').eq(petId).find('button.btn-adopt').text('Processing…').attr('disabled', true);

    const accounts = await App.getAccounts(nearWeb3);
    let account;
    if (accounts.length) {
      account = accounts[accounts.length - 1];
    } else {
      $('#status-messages')[0].innerHTML = 'Issue finding accounts…';
      return;
    }

    const adoptionResult = await App.contracts.Adoption.methods.adopt(petId).send({from: account});
    const transactionId = adoptionResult.transactionHash.split(':')[0];
    const dogName = $('.panel-pet').eq(petId).find('.panel-title')[0].innerHTML;
    $('#explorer-link a').attr('href', `${App.networkConfig.sites.explorerUrl}/transactions/${transactionId}`).text(`See ${dogName}'s adoption in NEAR Explorer`);
    console.log(`Thank you for adopting ${dogName}! 🐶🐶🐶`)
    console.log('Scroll to the top for a link to NEAR Explorer showing this transaction.')
    return App.markAdopted();
  },

  // Relayer descoped for now
  // Uncomment "Sign" button in index.html to enable functionality
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

    const chainId = parseInt(nearWeb3.currentProvider.version, 10);

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
        evmId: App.networkConfig.provider.evm_contract,
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
        res.innerHTML = `Signature:<br/>${signature}`;
        $('#status-messages')[0].innerHTML = '';

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
