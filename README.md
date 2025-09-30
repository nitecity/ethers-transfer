# Ethers Transfer CLI

A powerful Node.js CLI tool for transferring native and ERC-20 tokens, checking balances, generating wallets, and managing EVM chains and private keys securely. Built with [ethers.js](https://docs.ethers.org/) and [chalk](https://www.npmjs.com/package/chalk) for a beautiful terminal experience.

---

## Features

- 🚀 **Transfer Native Tokens** (ETH, BNB, etc.)
- 💸 **Transfer ERC-20 Tokens** (USDT, USDC, custom contracts)
- 📊 **Check Wallet Balances**
- 🔐 **Generate New Wallets** (mnemonic & private key)
- 🌐 **Add New EVM Chains** (custom RPC, explorer, currency)
- 🗝️ **Securely Add Private Keys** (encrypted with password)
- 🛡️ **Contract Validation** (ERC-20 compliance check)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the CLI

```bash
npm start
```

### 3. Follow the Interactive Prompts

You'll see a menu like:

```
--- Welcome! What do you want to do? ---
1. Transfer Native Token (e.g. ETH)
2. Transfer ERC20 Token (e.g. USDT)
3. Balance
4. Generate New Wallet
5. Add New Chain
6. Add New Private Key (Wallet)
0. Exit
```

---

## Usage Highlights

### 🔄 Transfer Native or ERC-20 Tokens
- Select chain (mainnet, base, op, bsc, sepolia, etc.)
- Enter recipient address or ENS
- Specify amount
- Review transaction details, fees, and confirm
- View explorer link after success

### 📦 Add New Chain
- Add custom EVM chains to `src/chains.json`
- Specify RPC, explorer, currency, and token contracts

### 🔐 Private Key Management
- Add private keys encrypted with a password
- Wallets stored in `.env` (never share this file!)

### 🛡️ Contract Validation
- Checks if a contract address is a valid ERC-20 token

---

## File Structure

```
main.js                # Entry point, CLI menu
src/
  addChain.js          # Add new EVM chain
  balance.js           # Check wallet balance
  chains.json          # List of supported chains
  encdec.js            # Encrypt/decrypt private keys
  erc20.js             # Transfer ERC-20 tokens
  genWallet.js         # Generate new wallet
  native.js            # Transfer native tokens
  utils.js             # Utility functions
  validateContract.js  # ERC-20 contract validation
```

---

## Security Notes

- **Private keys are encrypted** and stored locally in `.env`.
- **Passwords are required** to decrypt and use private keys.
- **Never share your `.env` file or passwords.**
- **Always verify contract addresses before sending tokens.**

---

## Requirements

- Node.js v16+
- Internet connection (for RPC calls)

---

## License

MIT

---

## Author

nitecity
