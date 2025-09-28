// ...existing code...
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { question } = require('./utils');

async function appendToJsonFile(filePath, newData) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8');
  }

  const raw = await fs.readFile(filePath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    json = [];
  }
  if (!Array.isArray(json)) {
    json = [];
  }

  json.push(newData);

  const tmp = `${filePath}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(json, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, filePath);
}

module.exports.addChain = async function() {
  const file = path.resolve(__dirname, 'chains.json');

  try {
    let chain;
    while(true){
      chain = (await question('Chain: '))?.toLowerCase();
      if(chain) break;
      console.log(chalk.red('"Chain" name is required. Try again'))
    }
    let rpc;
    while(true){
      rpc = await question('RPC: ');
      if(rpc && rpc.startsWith('https://')) break;
      console.log(chalk.red('"RPC" is required and starts with "https://". Try again'));
    }
    const wss = await question('WSS: ');
    const chainId = await question('Chain Id: ');
    let explorer;
    while(true){
      explorer = await question('Explorer: ');
      if(explorer && explorer.startsWith('https://')) break;
      console.log(chalk.red('"Explorer" is required and starts with "https://". Try again'));
    }
    let currency;
    while(true){
      currency = (await question('Currency: ')).toUpperCase();
      if(currency) break;
      console.log(chalk.red('"Currency" is required. Try again'));
    }

    const usdt = await question('USDT Contract: ');
    const usdc = await question('USDC Contract: ');
    const inputObj = {
      chain,
      rpc,
      wss,
      id: parseInt(chainId),
      explorer,
      currency,
      usdt,
      usdc
    }
    await appendToJsonFile(file, inputObj);

    console.log('Saved response to', file);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

