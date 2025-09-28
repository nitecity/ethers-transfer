const {ethers} = require('ethers');
const chalk = require('chalk');
const { question, getChain, getAddress, getAmount, lookup } = require('./utils');
const chains = require('./chains.json');
const { encrypt, decrypt } = require('./encdec');

const cyan = chalk.cyan;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magenta;
const green = chalk.green;
const blueBright = chalk.blueBright;
const redBright = chalk.redBright;
const italicCyan = chalk.italic.cyan;
const italicRed = chalk.italic.red;

module.exports.transferNative = async function() {
    const chain = await getChain(chains);
    console.log(blueBright(`"${chain}"`));
    const chainData = chains.find(c => c.chain === chain);
    const rpc      = chainData.rpc;
    const explorer = chainData.explorer;
    const recipientAddress = await getAddress(chains);
    const amount = await getAmount();

    try{
        await encrypt();
        let senderPrivateKey = await decrypt();
        const provider = new ethers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(senderPrivateKey, provider);
        senderPrivateKey = undefined;
        const balance = await provider.getBalance(signer.address);
        const b = ethers.formatEther(balance);
        const NativeCurrency = chainData.currency;

        // Fee calculation
        const tx = { to: recipientAddress, value: ethers.parseEther(amount) };
        const gasLimit = await provider.estimateGas({ ...tx, from: signer.address });
        const feeData = await provider.getFeeData();
        let estimatedFeeInWei;
        let estimatedFeeInEth;
        let formatGwei;
        if (feeData.maxFeePerGas) {
            estimatedFeeInWei = gasLimit * feeData.maxFeePerGas;
            estimatedFeeInEth = ethers.formatEther(estimatedFeeInWei);
            formatGwei = ethers.formatUnits(feeData.maxFeePerGas, "gwei");
        } else{
            console.log(italicRed("Could not get fee data from the provider."));
        }

        const [recipientEns, signerEns] = await lookup(recipientAddress, signer.address, chains);
        console.log(italicCyan(`Your Balance on ${chain}: "${b} ${NativeCurrency}"\n`));
        console.log(cyan(`-------------------------------------------------------------`));
        console.log(cyan(`Chain:          ${magenta(chain)}`));
        console.log(cyan(`Amount To Send: ${magenta(`${amount} ${NativeCurrency}`)}`));
        console.log(cyan(`From:           ${magenta(`${signer.address} ${signerEns}`)}`));
        console.log(cyan(`To:             ${magenta(`${recipientAddress} ${recipientEns}`)}`));
        console.log(cyan(`Gas Limit:                             ${magenta(gasLimit.toString())}`));
        console.log(cyan(`Estimated Gas Price (Max Fee Per Gas): ${magenta(`${formatGwei || '-'} Gwei`)}`));
        console.log(cyan(`Estimated Transaction Fee:             ${magenta(`${estimatedFeeInEth || '-'} ${NativeCurrency}`)}`));
        console.log(cyan('-------------------------------------------------------------\n'));

        const totalCost = parseFloat(amount) + parseFloat(estimatedFeeInEth);
        if(parseFloat(b) < totalCost) { console.log(red(`❌ Insufficient funds. You need ~${totalCost} ${NativeCurrency} for the transfer and fee.`)); return; }
        const sure = (await question(yellow('All Good? (yes/no): '))).toLowerCase();
        if(sure !== 'yes') process.exit(1);

        console.log(cyan(`Sending from wallet: ${signer.address}`));
        console.log(yellow(`Sending ${amount} ${NativeCurrency} to ${recipientAddress}...`));
        const transactionResponse = await signer.sendTransaction(tx);
        console.log(green("Transaction sent! Hash:"), chalk.blueBright.underline(transactionResponse.hash));
        console.log(yellow('Please wait...'));
        const receipt = await transactionResponse.wait();
        console.log(chalk.italic.magenta("Transaction confirmed in block:"), green(receipt.blockNumber));
        console.log(chalk.bold.green(`✅ Success! View on Explorer: `) + chalk.cyan.underline(`${explorer}tx/${transactionResponse.hash}`));
    } catch(error) {
        console.error(red("❌ Error sending transaction:"), redBright(error && error.message ? error.message : String(error)));
    }
}
