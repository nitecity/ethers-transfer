const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { question } = require('./utils');
const fileName = 'chains.json';

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
  const file = path.resolve(__dirname, fileName);
  const exists = await fs.access(file).then(() => true).catch(() => false);
  let chains;
  if(exists){
    const data = await fs.readFile(file, 'utf8');
    chains = JSON.parse(data);
  }
  
  try {
    let chain;
    while (true) {
      chain = (await question('Chain: ')).toLowerCase();
      if (!chain) {
        console.log(chalk.red('"Chain" is required. Try again'));
        continue;
      }
      if (chains && chains.find(c => c.chain === chain)) {
        console.log(chalk.red(`Chain "${chain}" already exists. Try again.`));
        continue;
      }
      break;
    }
    let rpc;
    while(true){
      rpc = await question('RPC: ');
      const regex = /^https:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if(regex.test(rpc)) break;
      console.log(chalk.red('"RPC" format is not valid. Try again'));
    }
    let wss;
    while(true){
      wss = await question('WSS (Optional): ');
      const regexWss = /^wss:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if(!wss) break;
      if(regexWss.test(wss)) break;
      console.log(chalk.red('"Websocket" format is not valid. Try again'));
    }
    let chainId = await question('Chain Id (Optional): ');
    if(chainId && isNaN(parseInt(chainId))){
      console.log(chalk.red('"Chain Id" must be a number. Setting to "null"'));
      chainId = null;
    }
    let explorer;
    while(true){
      explorer = await question('Explorer: ');
      const regexExplorer = /^https:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if(regexExplorer.test(explorer)) break;
      console.log(chalk.red('"Explorer" format is not valid. Try again'));
    }
    let currency;
    while(true){
      currency = (await question('Currency: ')).toUpperCase();
      if(currency) break;
      console.log(chalk.red('"Currency" is required. Try again'));
    }

    const usdt = await question('USDT Contract (Optional): ');
    const usdc = await question('USDC Contract (Optional): ');
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

    console.log(chalk.green('\nSaved data to -> '), file);
    console.log(chalk.cyan(`You can modify the data in ${fileName}.\n`));
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

