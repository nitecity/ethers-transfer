const { ethers } = require("ethers");
const chalk = require('chalk');

module.exports.createWallet = function() {
    const wallet = ethers.Wallet.createRandom();
    console.log(chalk.green("\n✅ New EVM Wallet Generated!"));
    console.log("--------------------------------------------------------------------------------------------------");
    console.log(chalk.cyan('Address:'), chalk.magenta(wallet.address));
    console.log(chalk.cyan('Mnemonic Phrase:'), chalk.magenta(wallet.mnemonic.phrase));

    console.log(chalk.cyan('Private Key:'), chalk.magenta(wallet.privateKey));
    console.log("--------------------------------------------------------------------------------------------------");
    console.log(chalk.yellow.bold("🔐 IMPORTANT: Store the Mnemonic Phrase and Private Key securely. Never share them!\n"));
}
