const {ethers} = require('ethers');
const chalk = require('chalk');
const chains = require('./chains.json');
const { question, getChain, getAddress, contractData, getAmount, lookup } = require('./utils');
const { encrypt, decrypt } = require('./encdec');
const { validateContract } = require('./validateContract');

const cyan = chalk.cyan;
const red = chalk.red;
const yellow = chalk.yellow;
const magenta = chalk.magenta;
const green = chalk.green;
const blueBright = chalk.blueBright;
const redBright = chalk.redBright;


module.exports.transferErc20 = async function() {
    const chain = await getChain(chains);
    console.log(blueBright(`"${chain}"`));
    const recipientAddress = await getAddress(chains);
    const chainData = chains.find(c => c.chain === chain);
    const [contractAddress, contractSymbol] = await contractData(chainData);
    const amount = await getAmount();
    const rpc      = chainData.rpc;
    const explorer = chainData.explorer;

    try{
        const provider = new ethers.JsonRpcProvider(rpc);
        await encrypt();
        let senderPrivateKey = await decrypt();
        const signer = new ethers.Wallet(senderPrivateKey, provider);
        senderPrivateKey = undefined;
        const balance = await provider.getBalance(signer.address);
        const b = ethers.formatEther(balance);
        const NativeCurrency = chains.find(c => c.chain === chain).currency;
        const erc20ABI = [
                "function transfer(address to, uint256 amount) returns (bool)",
                "function decimals() view returns (uint8)",
                "function balanceOf(address owner) view returns (uint256)"
        ];

        const tokenBalanceContract = new ethers.Contract(contractAddress, erc20ABI, provider);
        const tokenContract = new ethers.Contract(contractAddress, erc20ABI, signer);
        const tokenBalance = await tokenBalanceContract.balanceOf(signer.address);
        const decimals = await tokenContract.decimals();
        const tokenb = ethers.formatUnits(tokenBalance, decimals);
        const amountInSmallestUnit = ethers.parseUnits(amount, decimals);
        // Fee calculation
        const gasLimit = await tokenContract.transfer.estimateGas(recipientAddress, amountInSmallestUnit);
        const feeData = await provider.getFeeData();
        let estimatedFeeInWei;
        let estimatedFeeInEth;
        let formatGwei;
        if (feeData.maxFeePerGas) {
            estimatedFeeInWei = gasLimit * feeData.maxFeePerGas;
            estimatedFeeInEth = ethers.formatEther(estimatedFeeInWei);
            formatGwei = ethers.formatUnits(feeData.maxFeePerGas, "gwei");
        } else{
            console.log(red.italic("Could not get fee data from the provider."));
        }
        
        const [recipientEns, signerEns] = await lookup(recipientAddress, signer.address, chains);
        console.log(cyan.italic(`Your "${NativeCurrency}" balance on "${chain}": "${b}"`));
        console.log(cyan.italic(`Your "${contractSymbol}" balance on "${chain}": "${tokenb}"\n`));
        console.log(cyan(`-------------------------------------------------------------`));
        console.log(cyan(`Chain:          ${magenta(chain)}`));
        console.log(cyan(`Amount To Send: ${magenta(`${amount} ${contractSymbol}`)}`));
        console.log(cyan(`From:           ${magenta(`${signer.address} ${signerEns}`)}`));
        console.log(cyan(`To:             ${magenta(`${recipientAddress} ${recipientEns}`)}`));
        console.log(cyan(`Gas Limit:                             ${magenta(gasLimit.toString())}`));
        console.log(cyan(`Estimated Gas Price (Max Fee Per Gas): ${magenta(`${formatGwei || '-'} Gwei`)}`));
        console.log(cyan(`Estimated Transaction Fee:             ${magenta(`${estimatedFeeInEth || '-'} ${NativeCurrency}`)}`));
        console.log(cyan('-------------------------------------------------------------\n'));

        const sure = (await question(yellow('All Good? (yes/no): '))).toLowerCase();
        if(sure !== 'yes') process.exit(1);
        
        console.log(yellow(`Sending "${amount} ${contractSymbol}" to ${recipientAddress}...`));
        const transactionResponse = await tokenContract.transfer(recipientAddress, amountInSmallestUnit);
        console.log(green("Transaction sent! Hash:", transactionResponse.hash));
        console.log(yellow('Please wait...'));
        const receipt = await transactionResponse.wait();
        console.log(magenta.italic("Transaction confirmed in block:"), green(receipt.blockNumber));
        console.log(green.bold(`✅ Success! View on Explorer: ${explorer}/tx/${transactionResponse.hash}`));
    } catch(error){
        console.error(red("❌ Error sending transaction:"), redBright(error && error.message ? error.message : String(error)));
    }
}

