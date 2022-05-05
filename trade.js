const trade = require('./src/trader');

trade.run();
process.on('uncaughtException', err => {
    console.error(err && err.stack)
    trade.run();
});



