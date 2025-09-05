const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const CLIUtils = require('../utils/cli');

const config = new Command('config');

config
  .description('Manage user configuration')
  .option('--wallet <address>', 'Set wallet address')
  .option('--private-key <key>', 'Set private key (for signing)')
  .option('--ipfs-endpoint <url>', 'Set IPFS endpoint')
  .option('--rpc-url <url>', 'Set blockchain RPC URL')
  .option('--author <name>', 'Set commit author name')
  .option('--setup', 'Interactive setup wizard')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset configuration to defaults')
  .addHelpText('after', `
Examples:
  $ bvc config --setup                    Interactive configuration
  $ bvc config --show                     Show current settings
  $ bvc config --author "John Doe"        Set author name
  $ bvc config --rpc-url "https://..."    Set RPC URL
  $ bvc config --reset                    Reset all settings
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
        console.log(CLIUtils.colors.bold.primary('\n🔧 BVC Configuration Setup'));
        console.log('─'.repeat(40));
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'author',
            message: 'Your name (for commits):',
            default: userConfig.author || process.env.USER || '',
            validate: (input) => input.trim() ? true : 'Author name is required'
          },
          {
            type: 'confirm',
            name: 'useBlockchain',
            message: 'Configure blockchain connection?',
            default: true
          },
          {
            type: 'input',
            name: 'rpcUrl',
            message: 'Blockchain RPC URL:',
            default: userConfig.rpcUrl || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
            when: (answers) => answers.useBlockchain,
            validate: (input) => {
              if (!input.trim()) return 'RPC URL is required';
              if (!input.startsWith('http')) return 'RPC URL must start with http:// or https://';
              return true;
            }
          },
          {
            type: 'password',
            name: 'privateKey',
            message: 'Private key (for signing):',
            mask: '*',
            when: (answers) => answers.useBlockchain,
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
            name: 'ipfsEndpoint',
            message: 'IPFS endpoint:',
            default: userConfig.ipfsEndpoint || 'http://localhost:5001',
            when: (answers) => answers.useBlockchain
          }
        ]);

        // Update configuration with answers
        Object.assign(userConfig, answers);
        delete userConfig.useBlockchain; // Remove this temporary field

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
  console.log(CLIUtils.colors.bold.primary('\n⚙️  Current Configuration'));
  console.log('─'.repeat(40));
  
  const table = CLIUtils.table(['Setting', 'Value', 'Status']);
  
  const settings = [
    ['Author', userConfig.author || 'Not set', userConfig.author ? '✅' : '❌'],
    ['RPC URL', userConfig.rpcUrl ? CLIUtils.maskSensitive(userConfig.rpcUrl) : 'Not set', userConfig.rpcUrl ? '✅' : '❌'],
    ['Private Key', userConfig.privateKey ? '***********' : 'Not set', userConfig.privateKey ? '✅' : '❌'],
    ['IPFS Endpoint', userConfig.ipfsEndpoint || 'Not set', userConfig.ipfsEndpoint ? '✅' : '❌'],
    ['Wallet Address', userConfig.wallet || 'Not set', userConfig.wallet ? '✅' : '❌']
  ];
  
  settings.forEach(setting => table.push(setting));
  console.log(table.toString());
  
  const missingSettings = settings.filter(s => s[2] === '❌').length;
  if (missingSettings > 0) {
    console.log(CLIUtils.colors.warning(`\n⚠️  ${missingSettings} setting${missingSettings !== 1 ? 's' : ''} not configured`));
    console.log(CLIUtils.colors.muted('Run: bvc config --setup for interactive configuration'));
  } else {
    console.log(CLIUtils.colors.success('\n✅ All settings configured'));
  }
  
  console.log();
};

CLIUtils.maskSensitive = function(value) {
  if (!value) return value;
  if (value.length <= 10) return value;
  return value.slice(0, 10) + '...' + value.slice(-6);
};

module.exports = config;
