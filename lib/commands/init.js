const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default || require('inquirer');
const BlockchainService = require('../blockchain');
const CLIUtils = require('../utils/cli');
const InitializationChecker = require('../utils/initialization-checker');

const init = new Command('init');

init
  .description('Create a new BVC repository (blockchain required)')
  .argument('[name]', 'Repository name (will prompt if not provided)')
  .option('--local-only', 'Create repository locally without blockchain')
  .option('--interactive', 'Interactive mode with prompts')
  .option('--upgrade-blockchain', 'Upgrade existing local repository to blockchain')
  .addHelpText('after', `
Examples:
  $ bvc init my-project                  Create blockchain repository (requires config)
  $ bvc init --local-only my-repo        Create without blockchain
  $ bvc init --interactive               Interactive setup
  $ bvc init --upgrade-blockchain        Convert local repo to blockchain
`)
  .action(async (name, options) => {
    try {
      // Handle blockchain upgrade for existing repository
      if (options.upgradeBlockchain) {
        const bvcDir = path.join(process.cwd(), '.bvc');
        if (!await fs.pathExists(bvcDir)) {
          CLIUtils.error('Not in a BVC repository directory.');
          CLIUtils.info('Navigate to a BVC repository first, then run:');
          CLIUtils.info('  bvc init --upgrade-blockchain');
          return;
        }

        CLIUtils.info('🔄 Upgrading local repository to blockchain...');
        
        // Check if blockchain is already configured
        const configPath = path.join(bvcDir, 'config.json');
        const config = await fs.readJson(configPath);
        
        if (config.repoId && config.repoId.length > 0) {
          // Check if repository actually exists on blockchain
          try {
            const BlockchainService = require('../blockchain');
            const blockchain = new BlockchainService();
            const initialized = await blockchain.initialize(foundConfig);
            
            if (initialized) {
              const repoInfo = await blockchain.getRepository(config.repoId);
              if (repoInfo && repoInfo.name) {
                CLIUtils.success('Repository is already blockchain-enabled!');
                CLIUtils.info(`Blockchain ID: ${config.repoId}`);
                return;
              } else {
                CLIUtils.warning('Repository ID exists locally but not on blockchain. Re-upgrading...');
              }
            }
          } catch (error) {
            CLIUtils.warning('Could not verify blockchain repository. Re-upgrading...');
          }
        }

        // Check if user has blockchain configuration
        const userConfigPath = path.join(bvcDir, 'user-config.json');
        const homeUserConfig = path.join(require('os').homedir(), '.bvc', 'user-config.json');
        const parentUserConfig = path.join(process.cwd(), '..', '.bvc', 'user-config.json');
        
        let foundConfig = null;
        if (await fs.pathExists(userConfigPath)) {
          foundConfig = userConfigPath;
        } else if (await fs.pathExists(homeUserConfig)) {
          foundConfig = homeUserConfig;
        } else if (await fs.pathExists(parentUserConfig)) {
          foundConfig = parentUserConfig;
        }
        
        if (!foundConfig) {
          CLIUtils.warning('Blockchain not configured.');
          CLIUtils.info('Please run: bvc config --setup');
          CLIUtils.info('Then try: bvc init --upgrade-blockchain');
          return;
        }

        // Actually upgrade the repository to blockchain mode
        CLIUtils.info('🔄 Upgrading repository to blockchain mode...');
        
        try {
          // Initialize blockchain service
          const BlockchainService = require('../blockchain');
          const blockchain = new BlockchainService();
          const initialized = await blockchain.initialize(foundConfig);
          
          if (!initialized) {
            throw new Error('Failed to connect to blockchain');
          }

          // Generate repository ID
          const repoId = `${config.name}-${Date.now()}`;
          
          // Register repository on blockchain
          CLIUtils.info('📝 Registering repository on blockchain...');
          const blockchainRepoId = await blockchain.createRepo(config.name);
          
          // Update repository configuration with blockchain repo ID
          config.repoId = blockchainRepoId;
          config.author = 'luffy'; // From the config setup
          config.description = 'Upgraded to blockchain mode';
          
          await fs.writeJson(configPath, config, { spaces: 2 });
          
          CLIUtils.success('✅ Repository upgraded to blockchain mode!');
          CLIUtils.info(`📝 Repository ID: ${blockchainRepoId}`);
          CLIUtils.info('💰 Now you can use checkpoints for cost-efficient batch operations');
          
          return;
          
        } catch (error) {
          CLIUtils.error('Failed to upgrade repository:', error.message);
          CLIUtils.info('Repository remains in local-only mode');
          return;
        }
      }

      // Interactive mode or missing name
      if (options.interactive || !name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'repositoryName',
            message: 'Repository name:',
            default: name || 'my-bvc-repo',
            validate: (input) => {
              if (!input.trim()) return 'Repository name is required';
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return 'Repository name can only contain letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          },
          {
            type: 'confirm',
            name: 'useBlockchain',
            message: 'Connect to blockchain?',
            default: !options.localOnly
          },
          {
            type: 'input',
            name: 'description',
            message: 'Repository description (optional):',
            default: ''
          }
        ]);
        
        name = answers.repositoryName;
        options.localOnly = !answers.useBlockchain;
        options.description = answers.description;
      }

      const repoPath = path.join(process.cwd(), name);
      const bvcPath = path.join(repoPath, '.bvc');

      // Check if directory already exists
      if (await fs.pathExists(repoPath)) {
        CLIUtils.error(`Directory "${name}" already exists`);
        process.exit(1);
      }

      const spinner = CLIUtils.spinner('Creating repository structure...');
      spinner.start();

      // Create repository directory
      await fs.ensureDir(repoPath);
      await fs.ensureDir(bvcPath);

      let repoId = '';
      
      // Default to blockchain creation unless explicitly local-only
      if (!options.localOnly) {
        spinner.text = 'Checking blockchain configuration...';
        
        // Check configuration before proceeding
        const checker = new InitializationChecker();
        const configResult = await checker.checkConfiguration();
        
        if (!configResult.isValid) {
          spinner.stop();
          console.error(InitializationChecker.formatIssues(configResult.issues));
          return;
        }
        
        spinner.text = 'Connecting to blockchain...';
        
        const blockchain = new BlockchainService();
        
        // Look for blockchain config in multiple locations
        const userConfigPaths = [
          path.join(process.cwd(), '.bvc', 'user-config.json'),
          path.join(require('os').homedir(), '.bvc', 'user-config.json'),
          path.join(process.cwd(), '..', '.bvc', 'user-config.json')
        ];
        
        let foundConfig = null;
        for (const configPath of userConfigPaths) {
          if (await fs.pathExists(configPath)) {
            foundConfig = configPath;
            break;
          }
        }
        
        if (foundConfig) {
          const initialized = await blockchain.initialize(foundConfig);
          if (initialized) {
            try {
              spinner.text = 'Creating repository on blockchain...';
              repoId = await blockchain.createRepo(name);
              CLIUtils.info('✅ Repository created on blockchain');
            } catch (error) {
              spinner.warn('Failed to create repository on blockchain');
              CLIUtils.warning('Blockchain creation failed:', error.message);
              CLIUtils.info('Falling back to local repository');
            }
          } else {
            spinner.warn('Failed to initialize blockchain connection');
            CLIUtils.info('Falling back to local repository');
          }
        } else {
          spinner.fail('Blockchain configuration required');
          CLIUtils.error('Cannot create repository without blockchain configuration.');
          CLIUtils.info('Please configure blockchain first:');
          CLIUtils.info('  bvc config --setup');
          CLIUtils.info('Or use --local-only flag for local repository:');
          CLIUtils.info('  bvc init --local-only <name>');
          process.exit(1);
        }
      }

      spinner.text = 'Setting up repository files...';

      // Initialize basic structure
      const config = {
        repoId: repoId,
        name: name,
        description: options.description || '',
        createdAt: new Date().toISOString(),
        author: '', // Will be set from config
        branch: 'main',
        version: '1.0.0'
      };

      await fs.writeJson(path.join(bvcPath, 'config.json'), config, { spaces: 2 });
      await fs.writeJson(path.join(bvcPath, 'staging.json'), { files: [] }, { spaces: 2 });
      await fs.writeJson(path.join(bvcPath, 'commits.json'), [], { spaces: 2 });

      // Create a basic .gitignore equivalent
      const bvcIgnore = `# BVC ignore patterns
node_modules/
.env
*.log
.DS_Store
.bvc/
dist/
build/
`;
      await fs.writeFile(path.join(repoPath, '.bvcignore'), bvcIgnore);

      // Create a README template
      const readmeContent = `# ${name}

${options.description || 'A BVC (Blockchain Version Control) repository'}

## Getting Started

This repository is managed with BVC - Blockchain Version Control.

### Commands

- \`bvc status\` - Check repository status
- \`bvc add <files>\` - Stage files for commit
- \`bvc commit -m "message"\` - Commit changes
- \`bvc push\` - Push to blockchain
- \`bvc log\` - View commit history

### Repository Info

- **Created:** ${new Date().toLocaleDateString()}
- **Blockchain ID:** ${repoId || 'Local only'}
`;
      
      await fs.writeFile(path.join(repoPath, 'README.md'), readmeContent);

      spinner.succeed('Repository created successfully!');

      // Display success information
      CLIUtils.box(`${CLIUtils.icons.success} Repository "${name}" initialized successfully!

${CLIUtils.icons.folder} Location: ${repoPath}
${CLIUtils.icons.blockchain} Blockchain ID: ${repoId || 'Local only'}
${CLIUtils.icons.file} Files created: config.json, .bvcignore, README.md`, {
        borderColor: 'green',
        padding: 1
      });

      const nextSteps = [
        `cd ${name}`,
        'bvc add README.md',
        'bvc commit -m "Initial commit"'
      ];

      if (!repoId) {
        if (options.localOnly) {
          nextSteps.push('bvc config --setup  # Optional: Enable blockchain later');
        } else {
          nextSteps.unshift('bvc config --setup  # Configure blockchain connection');
        }
      } else {
        nextSteps.push('bvc checkpoint --message "Initial setup"  # Create first checkpoint');
      }

      CLIUtils.complete('Repository ready!', nextSteps);

    } catch (error) {
      CLIUtils.handleError(error, 'Repository initialization');
    }
  });

module.exports = init;
