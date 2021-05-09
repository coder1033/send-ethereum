App = {
  web3Provider: null,
  contracts: {},
  senderAddress: '',

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error('User denied account access');
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545',
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.sendEthInit();
  },

  sendEthInit: () => {
    const senderAddress = web3.eth.accounts[0];
    App.senderAddress = senderAddress;

    qrCode = `https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${senderAddress}&choe=UTF-8`;
    imgElement = document.getElementById('qr-code');
    imgElement.src = qrCode;

    document.getElementById('eth-address').innerHTML = senderAddress;

    App.updateBalance();
    App.bindEvents();
  },

  updateBalance: () => {
    web3.eth.getBalance(App.senderAddress, 'pending', (err, result) => {
      if (err) {
        console.log(err);
        return;
      } else {
        let ethBalance = web3.fromWei(result, 'ether');
        ethBalance = Math.round(ethBalance * 1000) / 1000;
        document.getElementById('eth-balance').innerHTML = ethBalance;
      }
    });
  },

  bindEvents: () => {
    const formElement = document.getElementById('send-eth-form');
    formElement.onsubmit = (event) => {
      event.preventDefault();

      const receiverAddress = event.target['send-to'].value.trim();
      const ethAmount = event.target['eth-amount'].value.trim();
      const amount = web3.toWei(ethAmount, 'ether');

      App.sendEth(receiverAddress, amount);
    };

    const closeModal = document.getElementById('close-modal');
    closeModal.onclick = () => {
      const sendTo = document.getElementById('send-to');
      const ethAmount = document.getElementById('eth-amount');
      const transactionFailed = document.getElementById('transaction-failed');

      sendTo.value = '';
      ethAmount.value = '';
      transactionFailed.innerHTML = '';

      closeModal.click();
    };
  },

  sendEth: (receiverAddress, amount) => {
    const transactionFailed = document.getElementById('transaction-failed');

    const isValid = web3.isAddress(receiverAddress);
    if (!isValid) {
      transactionFailed.innerHTML = 'Incorrect ETH address!';
      return;
    }

    web3.eth.sendTransaction(
      {
        from: App.senderAddress,
        to: receiverAddress,
        value: amount,
      },
      (err, result) => {
        if (err) {
          transactionFailed.innerHTML = 'Transaction failed!';
          return;
        }

        const closeModal = document.getElementById('close-modal');
        closeModal.click();

        const alertInfo = document.getElementById('alert-info');
        alertInfo.innerHTML = `Success! Transaction hash: ${result}`;
        alertInfo.classList.add('d-block');

        setTimeout(() => {
          alertInfo.classList.remove('d-block');
        }, 10000);

        App.updateBalance();
      },
    );
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
