const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default || require('inquirer');
const { ethers } = require('ethers');
const CLIUtils = require('../utils/cli');
const { getAllNetworks, getDefaultNetwork, isValidNetwork } = require('../config/networks');

const config = new Command('config');

config
  .description('Manage user configuration')
  .option('--wallet <address>', 'Set wallet address')
  .option('--private-key <key>', 'Set private key (for signing)')
  .option('--ipfs-endpoint <url>', 'Set IPFS endpoint')
  .option('--rpc-url <url>', 'Set blockchain RPC URL')
  .option('--network <name>', 'Set network (sepolia, localhost, mainnet)')
  .option('--contract-address <address>', 'Set contract address')
  .option('--author <name>', 'Set commit author name')
  .option('--setup', 'Interactive setup wizard')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset configuration to defaults')
  .addHelpText('after', `
Examples:
  $ bvc config --setup                         Interactive configuration
  $ bvc config --show                          Show current settings
  $ bvc config --author "John Doe"             Set author name
  $ bvc config --network sepolia               Use Sepolia testnet
  $ bvc config --rpc-url "https://..."         Set custom RPC URL
  $ bvc config --contract-address "0x..."      Set contract address
  $ bvc config --reset                         Reset all settings
`)
  .action(async (options) => {
    try {
      const configDir = path.join(process.cwd(), '.bvc');
      const configPath = path.join(configDir, 'user-config.json');

      // Ensure config directory exists
      await fs.ensureDir(configDir);

      let userConfig = {};
      if (await fs.pathExists(configPath)) {
        userConfig = await fs.readJson(configPath);
      }

      // Show current configuration
      if (options.show) {
        CLIUtils.showConfig(userConfig);
        return;
      }

      // Reset configuration
      if (options.reset) {
        const confirm = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'reset',
            message: 'Are you sure you want to reset all configuration?',
            default: false
          }
        ]);

        if (confirm.reset) {
          userConfig = {};
          await fs.writeJson(configPath, userConfig, { spaces: 2 });
          CLIUtils.success('Configuration reset successfully');
        } else {
          CLIUtils.info('Configuration reset cancelled');
        }
        return;
      }

      // Interactive setup
      if (options.setup) {
        console.log(CLIUtils.colors.boldPrimary('\n🔧 BVC Configuration Setup'));
        console.log('─'.repeat(40));
        
        const networks = getAllNetworks();
        const networkChoices = Object.keys(networks).map(key => ({
          name: `${networks[key].name} (${key})${networks[key].isTestnet ? ' [Testnet]' : ''}`,
          value: key
        }));
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'author',
            message: 'Your name (for commits):',
            default: userConfig.author || process.env.USER || '',
            validate: (input) => input.trim() ? true : 'Author name is required'
          },
          {
            type: 'list',
            name: 'network',
            message: 'Select blockchain network:',
            choices: networkChoices,
            default: userConfig.network || 'sepolia'
          },
          {
            type: 'confirm',
            name: 'useCustomRpc',
            message: 'Use custom RPC URL?',
            default: false,
            when: (answers) => {
              const network = networks[answers.network];
              return network && !network.rpcUrl.includes('YOUR_') && !network.rpcUrl.includes('localhost');
            }
          },
          {
            type: 'input',
            name: 'rpcUrl',
            message: 'Custom RPC URL:',
            default: (answers) => {
              const network = networks[answers.network];
              return userConfig.rpcUrl || (network ? network.rpcUrl : '');
            },
            when: (answers) => {
              const network = networks[answers.network];
              return answers.useCustomRpc || (network && (network.rpcUrl.includes('YOUR_') || network.rpcUrl.includes('localhost')));
            },
            validate: (input) => {
              if (!input.trim()) return 'RPC URL is required';
              if (!input.startsWith('http')) return 'RPC URL must start with http:// or https://';
              return true;
            }
          },
          {
            type: 'confirm',
            name: 'useCustomContract',
            message: 'Use custom contract address?',
            default: false,
            when: (answers) => {
              const network = networks[answers.network];
              return network && !network.contractAddress;
            }
          },
          {
            type: 'input',
            name: 'contractAddress',
            message: 'Contract address:',
            default: userConfig.contractAddress || '',
            when: (answers) => {
              const network = networks[answers.network];
              return answers.useCustomContract || (network && !network.contractAddress);
            },
            validate: (input) => {
              if (!input.trim()) return 'Contract address is required';
              if (!ethers.utils.isAddress(input)) return 'Invalid Ethereum address';
              return true;
            }
          },
          {
            type: 'password',
            name: 'privateKey',
            message: 'Private key (for signing):',
            mask: '*',
            validate: (input) => {
              if (!input.trim()) return 'Private key is required for blockchain operations';
              if (input.length !== 64 && !input.startsWith('0x')) {
                return 'Private key should be 64 characters (without 0x prefix)';
              }
              return true;
            }
          },
          {
            type: 'input',
            name: 'wallet',
            message: 'Wallet address (optional, will be derived from private key if not provided):'
          },
          {
            type: 'input',
            name: 'ipfsEndpoint',
            message: 'IPFS endpoint:',
            default: userConfig.ipfsEndpoint || 'http://localhost:5001'
          }
        ]);

        // Update configuration with answers
        Object.assign(userConfig, answers);
        delete userConfig.useCustomRpc; // Remove temporary fields
        delete userConfig.useCustomContract;

        // Derive wallet address from private key if not provided
        if (userConfig.privateKey && !userConfig.wallet) {
          try {
            const formattedKey = userConfig.privateKey.startsWith('0x') ? userConfig.privateKey : '0x' + userConfig.privateKey;
            const wallet = new ethers.Wallet(formattedKey);
            userConfig.wallet = wallet.address;
          } catch (error) {
            CLIUtils.warning('Could not derive wallet address from private key. Please set it manually.');
          }
        }

        await fs.writeJson(configPath, userConfig, { spaces: 2 });
        
        CLIUtils.success('Configuration setup complete!');
        CLIUtils.showConfig(userConfig);
        return;
      }

      // Individual option updates
      let updated = false;

      if (options.wallet) {
        userConfig.wallet = options.wallet;
        updated = true;
      }
      if (options.privateKey) {
        userConfig.privateKey = options.privateKey;
        updated = true;
      }
      if (options.ipfsEndpoint) {
        userConfig.ipfsEndpoint = options.ipfsEndpoint;
        updated = true;
      }
      if (options.rpcUrl) {
        userConfig.rpcUrl = options.rpcUrl;
        updated = true;
      }
      if (options.network) {
        if (!isValidNetwork(options.network)) {
          const validNetworks = Object.keys(getAllNetworks()).join(', ');
          throw new Error(`Invalid network: ${options.network}. Valid networks: ${validNetworks}`);
        }
        userConfig.network = options.network;
        updated = true;
      }
      if (options.contractAddress) {
        if (!ethers.utils.isAddress(options.contractAddress)) {
          throw new Error('Invalid contract address format');
        }
        userConfig.contractAddress = options.contractAddress;
        updated = true;
      }
      if (options.author) {
        userConfig.author = options.author;
        updated = true;
      }

      if (updated) {
        await fs.writeJson(configPath, userConfig, { spaces: 2 });
        CLIUtils.success('Configuration updated successfully');
        CLIUtils.showConfig(userConfig);
      } else {
        CLIUtils.info('No configuration changes specified');
        CLIUtils.info('Use --setup for interactive configuration or --help for options');
      }

    } catch (error) {
      CLIUtils.handleError(error, 'Configuration');
    }
  });

// Add showConfig method to CLIUtils
CLIUtils.showConfig = function(userConfig) {
  console.log(CLIUtils.colors.boldPrimary('\n⚙️  Current Configuration'));
  console.log('─'.repeat(40));
  
  const table = CLIUtils.table(['Setting', 'Value', 'Status']);
  
  const settings = [
    ['Author', userConfig.author || 'Not set', userConfig.author ? '✅' : '❌'],
    ['Network', userConfig.network || 'sepolia (default)', '✅'],
    ['RPC URL', userConfig.rpcUrl ? CLIUtils.maskSensitive(userConfig.rpcUrl) : 'Using network default', userConfig.rpcUrl ? '✅' : '⚠️'],
    ['Contract Address', userConfig.contractAddress ? CLIUtils.maskSensitive(userConfig.contractAddress) : 'Using network default', userConfig.contractAddress ? '✅' : '⚠️'],
    ['Private Key', userConfig.privateKey ? '***********' : 'Not set', userConfig.privateKey ? '✅' : '❌'],
    ['IPFS Endpoint', userConfig.ipfsEndpoint || 'http://localhost:5001 (default)', '✅'],
    ['Wallet Address', userConfig.wallet || 'Not set', userConfig.wallet ? '✅' : '❌']
  ];
  
  settings.forEach(setting => table.push(setting));
  console.log(table.toString());
  
  const missingSettings = settings.filter(s => s[2] === '❌').length;
  if (missingSettings > 0) {
    console.log(CLIUtils.colors.warning(`\n⚠️  ${missingSettings} setting${missingSettings !== 1 ? 's' : ''} not configured`));
    console.log(CLIUtils.colors.muted('Run: bvc config --setup for interactive configuration'));
  } else {
    console.log(CLIUtils.colors.success('\n✅ All required settings configured'));
  }
  
  // Show network info
  const networks = getAllNetworks();
  const selectedNetwork = userConfig.network || 'sepolia';
  if (networks[selectedNetwork]) {
    const networkInfo = networks[selectedNetwork];
    console.log(CLIUtils.colors.muted(`\n📡 Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`));
    if (networkInfo.blockExplorer) {
      console.log(CLIUtils.colors.muted(`🔍 Explorer: ${networkInfo.blockExplorer}`));
    }
    if (networkInfo.faucet) {
      console.log(CLIUtils.colors.muted(`🚰 Faucet: ${networkInfo.faucet}`));
    }
  }
  
  console.log();
};

CLIUtils.maskSensitive = function(value) {
  if (!value) return value;
  if (value.length <= 10) return value;
  return value.slice(0, 10) + '...' + value.slice(-6);
};

module.exports = config;
