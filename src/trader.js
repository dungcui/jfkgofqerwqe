const Web3 = require("web3");
const abi = require("../contracts/abi")

let nodeUrl = "https://bsc-dataseed2.defibit.io/";
let node2 = "https://bsc-dataseed1.defibit.io/"
let tempnode = "https://bsc-dataseed1.defibit.io/";
const Provider = require('@truffle/hdwallet-provider');
const { Decimal } = require("decimal.js");
var Promise = require("bluebird");

require('dotenv').config();

class Trader {
    
    constructor(){
        this.privateKey = process.env.privateKey;
        this.address = process.env.address;
        this.tokenAdress = process.env.tokenAdress;
        this.tokenDecimal = process.env.tokenDecimal;
        this.sippable = process.env.shippable;
        this.delayTime = process.env.delayTime;
        this.gasPrice = process.env.gasPrice;
        this.gasLimit = process.env.gasLimit;
        this.buyed = false;
        this.provider = new Provider(this.privateKey, nodeUrl)
        this.web3 = new Web3(this.provider) 
        this.bnbWantToBuy = process.env.bnbWantToBuy;
        this.router = new this.web3.eth.Contract(
            abi,
            '0x10ED43C718714eb63d5aA57B78B54704E256024E'
          );
    }
    async run(){
         const balance = await this.web3.eth.getBalance(this.address);
         await this.trade(balance);
    }

    async doGetPriceAndTrade(balance){
        let tokenPerBnb;
        let value;
        try {
            tokenPerBnb = await this.router.methods.getAmountsOut("1000000000000000000", ['0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', this.tokenAdress]).call();
            if(tokenPerBnb)
            {
                console.log("tokenPerBnb",Decimal(tokenPerBnb[1]).div(10**this.tokenDecimal));
            }
        } catch (ex) {    
            // console.log(ex)
        }      
        if(!tokenPerBnb)
        {
            console.log("don't listed yet")
            return;
        }            
            try{
                let path =[];
                /// Number BNB to BUY 0.1
                let amountOutMin = new Decimal(tokenPerBnb[1].toString()).mul(this.bnbWantToBuy).mul((100-this.sippable)).div(100).floor();
                path[0] = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
                path[1] = this.tokenAdress;
                /// deadline = 2 min
                console.log("amountOutMin",amountOutMin);
                
                let deadline = new Decimal(Date.now()).div(1000).floor().plus(120).toString()
                console.log("deadline",deadline);
                const amountIn = this.bnbWantToBuy*10**18;
                console.log("amountIn",amountIn);
                console.log("amountOutMin",amountOutMin);

                //0	amountOutMin	uint256	4526136326259845153
                //1	path	address[]	0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
                                        //0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
                ///2	to	address	0xEc077723DC2E2b7832D21c7381A5b73f69A968B0
                //3	deadline	uint256	1648544182


            
                const receipt = await this.router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMin.toString(), path, this.address, deadline).send({ gasPrice: this.gasPrice ,gasLimit:this.gasLimit,from :this.address ,value : amountIn});
                if(receipt.status === true){
                    console.log("buy success");
                    this.buyed = true;
                } else {
                    console.log("failed")
                    /// try again
                }
            } catch (e){
                console.log("failed",e)
                /// try again
                await this.reconnect()
                await this.trade(balance);
            }
    }
    async reconnect(){
        try{
            tempnode = node2;
            node2=nodeUrl;
            nodeUrl=tempnode;
            this.provider = new Provider(this.privateKey, nodeUrl)
            this.web3 = new Web3(this.provider)  
        }catch(ex){
            Promise.delay(this.delayTime);
            await this.reconnect()
        }
       
    }


    async trade(balance){
            process.setMaxListeners(10000000);
            // console.log("address",address)
            // console.log("privateKey",privateKey)
            // console.log("tokenAdress",tokenAdress)
            this.web3.eth._provider.engine.on("error", async () => {
                try{
                    await this.reconnect()
                    await this.trade(balance);
                }catch(ex){
                    await this.reconnect() 
                    await this.trade(balance);
                }
            });    
            while(!this.buyed){
                try{
                    Promise.delay(this.delayTime);
                    await this.doGetPriceAndTrade(balance)
                }catch(ex){
                    Promise.delay(this.delayTime);
                    await this.doGetPriceAndTrade(balance)
                }
                
            }
        }


}

module.exports = new Trader();
