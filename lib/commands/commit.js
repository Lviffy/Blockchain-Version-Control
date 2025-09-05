const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const inquirer = require('inquirer');
const BlockchainService = require('../blockchain');
const CLIUtils = require('../utils/cli');

const commit = new Command('commit');

commit
  .description('Create a new commit')
  .option('-m, --message <message>', 'Commit message')
  .option('--local-only', 'Commit locally without blockchain/IPFS')
  .option('--amend', 'Amend the last commit')
  .option('--interactive', 'Interactive commit with editor')
  .addHelpText('after', `
Examples:
  $ bvc commit -m "Initial commit"        Create commit with message
  $ bvc commit --interactive              Interactive commit
  $ bvc commit --local-only -m "Local"    Commit without blockchain
  $ bvc commit --amend -m "Fixed typo"    Amend last commit
`)
  .action(async (options) => {
    try {
      const bvcPath = await CLIUtils.validateBVCRepo(fs, path);
      const stagingPath = path.join(bvcPath, 'staging.json');
      const commitsPath = path.join(bvcPath, 'commits.json');
      const configPath = path.join(bvcPath, 'config.json');

      const staging = await fs.readJson(stagingPath);
      const config = await fs.readJson(configPath);
      let commits = await fs.readJson(commitsPath);

      // Check if there are files to commit
      if (staging.files.length === 0 && !options.amend) {
        CLIUtils.warning('Nothing to commit');
        CLIUtils.info('Stage files first with "bvc add <files>"');
        process.exit(1);
      }

      // Get commit message
      let commitMessage = options.message;
      
      if (!commitMessage && (options.interactive || !options.message)) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: 'Commit message:',
            validate: (input) => {
              if (!input.trim()) return 'Commit message is required';
              return true;
            }
          },
          {
            type: 'confirm',
            name: 'confirmFiles',
            message: `Commit ${staging.files.length} staged file${staging.files.length !== 1 ? 's' : ''}?`,
            default: true,
            when: staging.files.length > 0
          }
        ]);
        
        commitMessage = answers.message;
        
        if (answers.confirmFiles === false) {
          CLIUtils.info('Commit cancelled');
          process.exit(0);
        }
      }

      if (!commitMessage) {
        CLIUtils.error('Commit message is required');
        CLIUtils.info('Use: bvc commit -m "Your message" or bvc commit --interactive');
        process.exit(1);
      }

      const spinner = CLIUtils.spinner('Creating commit...');
      spinner.start();

      // Calculate commit hash from staged files
      const fileHashes = staging.files.map(f => f.hash).sort();
      const commitContent = fileHashes.join('') + commitMessage + new Date().toISOString();
      const commitHash = crypto.createHash('sha256')
        .update(commitContent)
        .digest('hex');

      // Get last commit hash
      const parentHash = commits.length > 0 ? commits[commits.length - 1].commitHash : null;

      let ipfsCid = '';
      let blockchainSuccess = false;
      
      if (!options.localOnly) {
        spinner.text = 'Connecting to blockchain...';
        
        const blockchain = new BlockchainService();
        const userConfigPath = path.join(process.cwd(), '.bvc', 'user-config.json');
        
        if (await fs.pathExists(userConfigPath)) {
          const initialized = await blockchain.initialize(userConfigPath);
          if (initialized) {
            try {
              spinner.text = 'Uploading files to IPFS...';
              
              // Create full file paths for IPFS upload
              const fullFiles = staging.files.map(f => ({
                ...f,
                path: path.join(process.cwd(), f.path)
              }));
              
              ipfsCid = await blockchain.uploadCommitToIPFS(fullFiles);
              
              if (config.repoId && ipfsCid) {
                spinner.text = 'Recording commit on blockchain...';
                await blockchain.commitToBlockchain(
                  config.repoId,
                  commitHash,
                  ipfsCid,
                  commitMessage
                );
                blockchainSuccess = true;
              }
            } catch (error) {
              spinner.warn('Blockchain/IPFS operation failed');
              CLIUtils.warning('Blockchain operation failed', error.message);
              CLIUtils.info('Commit will be saved locally only');
            }
          }
        } else {
          spinner.warn('Blockchain configuration not found');
        }
      }

      spinner.text = 'Saving commit locally...';

      // Handle amend
      if (options.amend && commits.length > 0) {
        commits[commits.length - 1] = {
          ...commits[commits.length - 1],
          message: commitMessage,
          timestamp: new Date().toISOString(),
          amended: true
        };
      } else {
        // Create new commit object
        const newCommit = {
          repoId: config.repoId,
          commitHash: commitHash,
          parentHash: parentHash,
          author: config.author || process.env.USER || 'unknown',
          message: commitMessage,
          timestamp: new Date().toISOString(),
          ipfsCid: ipfsCid,
          blockchainRecorded: blockchainSuccess,
          files: staging.files.map(f => ({
            path: f.path,
            hash: f.hash,
            size: f.size
          }))
        };

        commits.push(newCommit);
      }

      // Save commits and clear staging
      await fs.writeJson(commitsPath, commits, { spaces: 2 });
      await fs.writeJson(stagingPath, { files: [] }, { spaces: 2 });

      spinner.succeed('Commit created successfully!');

      // Display commit summary
      CLIUtils.box(`${CLIUtils.icons.success} Commit Summary

${CLIUtils.icons.git} Hash: ${commitHash.slice(0, 8)}...
${CLIUtils.icons.file} Files: ${staging.files.length}
📝 Message: "${commitMessage}"
${CLIUtils.icons.blockchain} Blockchain: ${blockchainSuccess ? 'Recorded' : 'Local only'}
${CLIUtils.icons.ipfs} IPFS CID: ${ipfsCid || 'Not uploaded'}`, {
        borderColor: 'green'
      });

      if (staging.files.length > 0) {
        console.log(CLIUtils.colors.muted('\nCommitted files:'));
        staging.files.forEach(file => {
          console.log(CLIUtils.colors.muted(`  • ${file.path}`));
        });
      }

      // Next steps
      const nextSteps = [];
      if (blockchainSuccess) {
        nextSteps.push('bvc push  # Share with others');
      } else if (!options.localOnly) {
        nextSteps.push('bvc config --setup  # Configure blockchain for sharing');
      }
      nextSteps.push('bvc log  # View commit history');

      if (nextSteps.length > 0) {
        CLIUtils.complete('', nextSteps);
      }

    } catch (error) {
      CLIUtils.handleError(error, 'Commit creation');
    }
  });

module.exports = commit;
