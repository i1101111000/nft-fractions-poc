const Web3 = require('web3');
const Dex = require('../contracts/bsc/Dex.json');

const web3Bsc = new Web3('wss://data-seed-prebsc-1-s1.binance.org:8545');

const dex = new web3Bsc.eth.Contract(
    Dex.abi,
    Dex.networks['97'].address
);

setInterval(() => {
    dex.events.NewTrade(
        { fromBlock: 0, step: 0 }
    )
        .on('data', event => {
            console.log(event);
        });
}, 60000);

