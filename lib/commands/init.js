const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const BlockchainService = require('../blockchain');
const CLIUtils = require('../utils/cli');

const init = new Command('init');

init
  .description('Create a new BVC repository')
  .argument('[name]', 'Repository name (will prompt if not provided)')
  .option('--local-only', 'Create repository locally without blockchain')
  .option('--interactive', 'Interactive mode with prompts')
  .addHelpText('after', `
Examples:
  $ bvc init my-project              Create a new repository
  $ bvc init --local-only my-repo    Create without blockchain
  $ bvc init --interactive           Interactive setup
`)
  .action(async (name, options) => {
    try {
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
      
      if (!options.localOnly) {
        spinner.text = 'Connecting to blockchain...';
        
        const blockchain = new BlockchainService();
        const userConfigPath = path.join(process.cwd(), '.bvc', 'user-config.json');
        
        if (await fs.pathExists(userConfigPath)) {
          const initialized = await blockchain.initialize(userConfigPath);
          if (initialized) {
            try {
              spinner.text = 'Creating repository on blockchain...';
              repoId = await blockchain.createRepo(name);
            } catch (error) {
              spinner.warn('Failed to create repository on blockchain');
              CLIUtils.warning('Blockchain creation failed', error.message);
              CLIUtils.info('Repository will be created locally only');
            }
          }
        } else {
          spinner.warn('Blockchain configuration not found');
          CLIUtils.info('Creating locally only. Configure blockchain later with:', 'bvc config --help');
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

      if (!repoId && !options.localOnly) {
        nextSteps.unshift('bvc config --setup  # Configure blockchain connection');
      }

      CLIUtils.complete('Repository ready!', nextSteps);

    } catch (error) {
      CLIUtils.handleError(error, 'Repository initialization');
    }
  });

module.exports = init;
