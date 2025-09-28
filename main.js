const readline = require('readline');
const chalk = require('chalk');
const { transferNative } = require('./src/native');
const { transferErc20 } = require('./src/erc20');
const { balance } = require('./src/balance');
const { createWallet } = require('./src/genWallet');
const { addChain } = require('./src/addChain');
const { encrypt } = require('./src/encdec');
const { question } = require('./src/utils');
const cyan = chalk.cyan;
const yellow = chalk.yellow;
const red = chalk.red;

async function main() {
    console.log(yellow('\n--- Welcome! What do you want to do? ---'));
    console.log('-----------------------------------------');
    console.log(cyan('1. Transfer Native Token (e,g. ETH)'));
    console.log('-----------------------------------------');
    console.log(cyan('2. Transfer ERC20 Token (e,g. USDT)'));
    console.log('-----------------------------------------');
    console.log(cyan('3. Balance'));
    console.log('-----------------------------------------');
    console.log(cyan('4. Generate New Wallet'));
    console.log('-----------------------------------------');
    console.log(cyan('5. Add New Chain'));
    console.log('-----------------------------------------');
    console.log(cyan('6. Add New Private Key (Wallet)'));
    console.log('-----------------------------------------');
    console.log(cyan('0. Exit'));
    console.log('-----------------------------------------');

    const validOptions = ['0', '1', '2', '3', '4', '5', '6'];
    let option;
    while(true){
        option = (await question('> '));
        if (!validOptions.includes(option)){
            console.log(red('Invalid Option. Try again'));
            continue;
        }
        switch(option){
            case '0':
                return;
            case '1':
                await transferNative();
                break;
            case '2':
                await transferErc20();
                break;
            case '3':
                await balance();
                break;
            case '4':
                createWallet();
                break;
            case '5':
                await addChain();
                break;
            case '6':
                await encrypt(true);
                break;
        }
        break;
    }
}

main().catch(err => console.error(err));