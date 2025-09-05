const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');

const config = new Command('config');

config
  .description('Manage user configuration')
  .option('--wallet <address>', 'Set wallet address')
  .option('--private-key <key>', 'Set private key (for signing)')
  .option('--ipfs-endpoint <url>', 'Set IPFS endpoint')
  .option('--rpc-url <url>', 'Set blockchain RPC URL')
  .action(async (options) => {
    const configPath = path.join(process.cwd(), '.bvc', 'user-config.json');

    try {
      let userConfig = {};
      if (await fs.pathExists(configPath)) {
        userConfig = await fs.readJson(configPath);
      }

      if (options.wallet) {
        userConfig.wallet = options.wallet;
      }
      if (options.privateKey) {
        userConfig.privateKey = options.privateKey;
      }
      if (options.ipfsEndpoint) {
        userConfig.ipfsEndpoint = options.ipfsEndpoint;
      }
      if (options.rpcUrl) {
        userConfig.rpcUrl = options.rpcUrl;
      }

      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, userConfig, { spaces: 2 });

      console.log('Configuration updated successfully.');

    } catch (error) {
      console.error('Error updating configuration:', error.message);
      process.exit(1);
    }
  });

module.exports = config;
