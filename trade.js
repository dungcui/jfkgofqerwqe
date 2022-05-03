const trade = require('./src/trader');
try{
    trade.run();
}catch(ex){
    console.log(ex);
    trade.run();
}




