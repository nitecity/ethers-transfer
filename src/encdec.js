// ...existing code...
const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');
const { ethers } = require('ethers');
const chalk = require('chalk');

const ENV_FILE = '.env';
const PBKDF2_ITER = 100000;

async function getInput(prompt, mask = false) {
  return new Promise((resolve) => {
    if (!mask) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
    } else {
      if (!process.stdin.isTTY) { // fallback if not a TTY
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
        return;
      }
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let input = '';
      process.stdout.write(prompt);
      const listener = (key) => {
        const char = key.toString('utf8');
        switch (char) {
          case '\u0003': // Ctrl+C
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', listener);
            process.exit();
            break;
          case '\r':
          case '\n':
            process.stdout.write('\n');
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', listener);
            resolve(input);
            break;
          case '\u007F': // Delete (Unix)
          case '\u0008': // Backspace (Windows)
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.clearLine(0);
              readline.cursorTo(process.stdout, 0);
              process.stdout.write(prompt + '*'.repeat(input.length));
            }
            break;
          default:
            // accept spaces and tabs in passwords; only ignore control characters
            if (char >= ' ' ) {
                input += char;
                process.stdout.clearLine(0);
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(prompt + '*'.repeat(input.length));
            }
            break;
        }
      };
      process.stdin.on('data', listener);
    }
  });
}

module.exports.encrypt = async function(addPk=false) {
  const envExists = fs.existsSync(ENV_FILE);
  if(addPk){
    if (envExists) {
      const [name, combined] = await checkInputEnc();
      const rl = readline.createInterface({ input: fs.createReadStream(ENV_FILE), crlfDelay: Infinity });
      const lines = [];
      rl.on('line', (line) => {
        const regex = new RegExp(`^${name}=(.+)$`);
        const test = regex.test(line);
        if(test) { console.log(chalk.red(`"${name}" is already exists.`)); process.exit(1); }
        lines.push(line);
      });
      rl.on('close', () => {
        lines.push(`${name}="${combined}"`);
        fs.writeFileSync(ENV_FILE, lines.join('\n'), { mode: 0o600 });
        console.log(chalk.green('✅ Added New Private Key'));
      });
    } else {
      const [name, combined] = await checkInputEnc();
      fs.writeFileSync(ENV_FILE, `${name}="${combined}"\n`, { mode: 0o600 });
    }
  } else{
    if (!envExists){
      const [name, combined] = await checkInputEnc();
      fs.writeFileSync(ENV_FILE, `${name}="${combined}"\n`, { mode: 0o600 });
    }
  }
}

module.exports.decrypt = async function () {
  const envExists = fs.existsSync(ENV_FILE);
  let envContent;
  if(envExists){
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }else{
    console.log(chalk.redBright(`".env" does not exist.`));
    process.exit(1);
  }
  const lines = envContent.split('\n');
  let encryptedSecret;
  let PKName;
  let PKNames = [];
  while(true){
    console.log(chalk.yellowBright('- Your Wallet Name:'));
    const nameRegex = /^(\w+)=".*"/;
    for(let i=0; i<lines.length; i++){
      if(i === 6) break;
      const match = lines[i].match(nameRegex);
      //console.log(match);
      if(match){
        console.log(chalk.magenta(`${i+1}. ${match[1]}`));
        PKNames.push(match[1].trim());
      }
    }
    console.log(chalk.magenta('Write a name that exists in ".env"'));
    PKName = (await getInput('> ')).trim();
    for(let i=0; i<5; i++){
      if(parseInt(PKName) === (i+1)){
        PKName = PKNames[i];
      }
    }
    const inputPKNameRegex = /^[A-Za-z1-9_]+$/;
    if(!inputPKNameRegex.test(PKName)){ console.log(chalk.red('Name is required and must be letters, numbers or underscores.')); continue; }
    console.log(chalk.blueBright.italic(PKName));
    const regex = new RegExp(`^${PKName}=(.*)$`, 'm');
    let val;
    for(const line of lines){
      const match = line.match(regex);
      if(match) { val = match[1].trim() };
    }
    if(val){
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      encryptedSecret = val;
    }
    if(!encryptedSecret) {
      console.log(chalk.redBright(`"${PKName}" does not exist or has no value`));
      process.exit(1);
      //continue;
    }
    break;
  }

  let password;
  while(true){
    password = await getInput(chalk.yellowBright('- Enter your password: '), true);
    const parts = encryptedSecret.split(':');
    if (parts.length !== 4) {
      console.log(chalk.redBright('Invalid encrypted data.'));
      process.exit(1);
    }
    const salt = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');
    const encrypted = Buffer.from(parts[3], 'base64');
    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITER, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    } catch (e) {
      console.log(chalk.redBright('Invalid password. Try again'));
    }
  }
}

function isPkValid(pk){
    try {
        new ethers.Wallet(pk);
        return true;
    } catch(err){
        return false;
    }
}


async function checkInputEnc(){
  let name;
  let password;
  let secretCode;
  while(true){
    name = (await getInput(chalk.cyan('Name of New Wallet: '))).trim();
    const regex = /^[A-Za-z1-9_]+$/;
    if(!regex.test(name)){ console.log(chalk.red('Name is required and must be letters, numbers or underscores.')); continue; }
    break;
  }  
  while(true){
    secretCode = (await getInput(chalk.cyan('Enter your Private Key: '))).trim();
    if(!isPkValid(secretCode)){
        console.log(chalk.red('"Private Key" is not valid. Try again'));
        continue;
    }
    break;
  }
  while(true){
    console.log(chalk.yellow('** Notice: If you forget your password, there is no way to recover it **'));
    password = await getInput(chalk.cyan('Enter your password: '), true);
    if(!password || password.length < 3){
      console.log(chalk.redBright('Password required and must be at least 3 characters. Try again'));
      continue;
    }
    break;
  }

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITER, 32, 'sha512');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(secretCode, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');

  return [name, combined];
}
