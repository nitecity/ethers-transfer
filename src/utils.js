const readline = require('readline');
const chalk = require('chalk');
const { ethers } = require('ethers');
const { validateContract } = require('./validateContract');

const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magenta;
const blueBright = chalk.blueBright;

function question(userInput){
    return new Promise(resolve =>{
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(userInput, (answer) => {
            rl.close();
            resolve(answer.trim());
        })
    })
}

module.exports.getChain = async function(chains){
    console.log(yellow('- Chain:'));
    console.log(magenta('1. Mainnet'));
    console.log(magenta('2. Base'));
    console.log(magenta('3. OP'));
    console.log(magenta('4. BNB Smart Chain'));
    console.log(magenta('5. Sepolia (Testnet)'));
    console.log(magenta('6. BNB Smart Chain (Testnet)'));
    console.log(magenta('Or write a chain that exists in "chains.json"'));

    let chain;
    while(true){
        chain = (await question(`> `)).toLowerCase();
        if (chain === '1') { chain = 'mainnet'; break;}
        if (chain === '2') { chain = 'base'; break;}
        if (chain === '3') { chain = 'op'; break; }
        if (chain === '4') { chain = 'bsc'; break; }
        if (chain === '5') { chain = 'sepolia'; break; }
        if (chain === '6') { chain = 'bsc testnet'; break; }
        if (chains.some( c => c.chain === chain)) break;
        console.log(red(`"${chain}" is not defined in "chains.json". Try again`));
    }
    return chain;
}

module.exports.getAddress = async function(chains){
    let address;
    while(true){
        address = (await question(chalk.yellow('- Address or ENS: ')));
        const regex = /\.eth$/
        if (regex.test(address)){
            try {
                const mainnetRpc = chains.find(c => c.chain === 'mainnet').rpc;
                const mainnetProvider = new ethers.JsonRpcProvider(mainnetRpc);
                const resolvedAddress = await mainnetProvider.resolveName(address);
                if(resolvedAddress){
                    address = resolvedAddress;
                    break;
                }else {
                    console.log(red(`"${address}" is not valid. Try again`));
                    continue;
                }
            } catch(err){
                console.log(red(`Error: ${err.message}`));
                process.exit(1);
            }
        }
        const isValid = ethers.isAddress(address);
        if(!isValid) { console.log(red('Address is not valid. Try again')); continue; }
        break;
    }
    return address;
}

module.exports.getAmount = async function(){
    let amount;
    while(true){
        amount = (await question(yellow('- Amount: ')));
        const isDigit = /^\d+(\.\d+)?$/.test(amount)
        if (!isDigit || Number(amount) === 0) {
            console.log(red(`"${amount}" is not valid. Use digits bigger than 0, e.g. 0.01`));
            continue;
        }
        break;
    }
    return amount;
}

module.exports.contractData = async function(chainData){
    let contractAddress;
    let contractSymbol;
    while(true){
        console.log(yellow('- Token:'));
        console.log(yellow('1. USDT'));
        console.log(yellow('2. USDC'));
        console.log(yellow('Or Enter the "Token Contract Address":'));
        
        contractAddress = (await question(yellow('> ')));
        if(contractAddress === '1') { contractAddress = chainData.usdt; }
        if(contractAddress === '2') { contractAddress = chainData.usdc; }
        contractSymbol = await validateContract(contractAddress, chainData.rpc);
        if (contractSymbol) break;
        console.log(red('Invalid Contract Address. Try again'));
    }

    return [contractAddress, contractSymbol];
}

module.exports.lookup = async function(recipientAddress, signerAddress, chains){
    let recipientEns;
    let signerEns;
    try {
        const mainnetRpc = chains.find(c => c.chain === 'mainnet').rpc;
        const mainnetProvider = new ethers.JsonRpcProvider(mainnetRpc);
        const resolvedRecipientAddress = await mainnetProvider.lookupAddress(recipientAddress);
        const resolvedSignerAddres = await mainnetProvider.lookupAddress(signerAddress);
        resolvedRecipientAddress ? recipientEns = blueBright(`[${resolvedRecipientAddress}]`) : recipientEns = yellow('[No ENS]');
        resolvedSignerAddres ? signerEns = blueBright(`$[{resolvedSignerAddres}]`) : signerEns = yellow('[No ENS]');
        return [recipientEns, signerEns];
    } catch(err){
        console.log(red(`Error: ${err.message}`));
        process.exit(1);
    }
}

module.exports.question = question;
