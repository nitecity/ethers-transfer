const {ethers} = require('ethers');
const { getChain, getAddress } = require('./utils');
const chalk = require('chalk');
const chains = require('./chains.json');

const red = chalk.red;
const magenta = chalk.magenta;
const green = chalk.green;
const redBright = chalk.redBright;


module.exports.balance = async function() {
    const chain = await getChain(chains);
    const chainData = chains.find(c => c.chain === chain);
    const rpc = chainData.rpc;
    const nativeCurrency = chainData.currency;
    const address = await getAddress(chains);

    try{
        const provider = new ethers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(address);
        const b = ethers.formatEther(balance);
        console.log(green('Wallet Address:'), magenta(`"${address}"`));
        console.log(green('Balance:'), magenta(`"${b} ${nativeCurrency}" on "${chain.toUpperCase()}"`));
    } catch(error) {
        console.error(red("❌ Error:"), redBright(error && error.message ? error.message : String(error)));
    }
}
