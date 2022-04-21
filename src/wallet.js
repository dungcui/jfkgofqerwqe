const Web3 = require("web3");

require('dotenv').config();

class App {
    async newWallet(){
        const web3 = new Web3("https://bsc-dataseed1.ninicoin.io/")
        const address = await web3.eth.accounts.create();
        console.log("address ", address)
    }
}

module.exports = new App();
