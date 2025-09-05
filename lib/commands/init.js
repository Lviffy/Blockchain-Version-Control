const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const BlockchainService = require('../blockchain');

const init = new Command('init');

init
  .description('Create a new BVC repository')
  .argument('<name>', 'Repository name')
  .option('--local-only', 'Create repository locally without blockchain')
  .action(async (name, options) => {
    const repoPath = path.join(process.cwd(), name);
    const bvcPath = path.join(repoPath, '.bvc');

    try {
      // Create repository directory
      await fs.ensureDir(repoPath);

      // Create .bvc directory
      await fs.ensureDir(bvcPath);

      let repoId = '';
      
      if (!options.localOnly) {
        // Try to create repository on blockchain
        const blockchain = new BlockchainService();
        const userConfigPath = path.join(process.cwd(), '.bvc', 'user-config.json');
        
        if (await fs.pathExists(userConfigPath)) {
          const initialized = await blockchain.initialize(userConfigPath);
          if (initialized) {
            try {
              console.log('Creating repository on blockchain...');
              repoId = await blockchain.createRepo(name);
              console.log(`Repository created on-chain with ID: ${repoId}`);
            } catch (error) {
              console.warn('Failed to create repository on blockchain:', error.message);
              console.log('Repository will be created locally only.');
            }
          }
        } else {
          console.log('Blockchain configuration not found. Creating locally only.');
          console.log('Configure blockchain with: bvc config --private-key <key> --rpc-url <url>');
        }
      }

      // Initialize basic structure
      const config = {
        repoId: repoId,
        name: name,
        createdAt: new Date().toISOString(),
        author: '', // Will be set from config
      };

      await fs.writeJson(path.join(bvcPath, 'config.json'), config, { spaces: 2 });

      // Create staging area
      await fs.writeJson(path.join(bvcPath, 'staging.json'), { files: [] }, { spaces: 2 });

      // Create commits log
      await fs.writeJson(path.join(bvcPath, 'commits.json'), [], { spaces: 2 });

      console.log(`Initialized BVC repository in ${repoPath}`);
      if (repoId) {
        console.log(`Repository ID: ${repoId}`);
      }
      console.log('Next steps:');
      console.log('1. Configure your wallet: bvc config --private-key <key>');
      console.log('2. Add files: bvc add <file>');
      console.log('3. Commit: bvc commit -m "message"');

    } catch (error) {
      console.error('Error initializing repository:', error.message);
      process.exit(1);
    }
  });

module.exports = init;
