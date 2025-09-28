/**
 * This script checks if a given EVM address corresponds to a smart contract
 * and attempts to validate if it implements a basic ERC-20 interface.
 */

const { ethers } = require("ethers");

// A minimal ABI for the ERC-20 functions we want to check
const MINIMAL_ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)"
];

// --- Main Checking Function ---
module.exports.validateContract = async function validateContract(address, rpc) {
    console.log(`\n--- Validating Contract Address: ${address} ---`);
    const provider = new ethers.JsonRpcProvider(rpc);

    try {
        // 1. Check if code exists at the address
        const code = await provider.getCode(address);

        if (code === '0x') {
            console.log("❌ Result: This is an Externally Owned Account (EOA) or an empty address. Not a contract.");
            return false;
        }
        console.log("✅ Code Check: Bytecode found. This is a smart contract.");

        // 2. Check for ERC-20 interface compliance
        try {
            const contract = new ethers.Contract(address, MINIMAL_ERC20_ABI, provider);
            
            // Attempt to call standard ERC-20 view functions
            const name = await contract.name();
            const symbol = await contract.symbol();
            const totalSupply = await contract.totalSupply();
            const decimals = await contract.decimals();

            console.log("✅ ERC-20 Interface Check: Passed.");
            console.log(`   - Name: ${name}`);
            console.log(`   - Symbol: ${symbol}`);
            console.log(`   - Total Supply: ${ethers.formatUnits(totalSupply, decimals)}\n`);
            return symbol;

        } catch (interfaceError) {
            console.log("❌ ERC-20 Interface Check: Failed. The contract does not seem to implement standard ERC-20 functions.");
            return false;
        }

    } catch (error) {
        console.error("An error occurred during validation:", error.message);
        return false;
    }
}

