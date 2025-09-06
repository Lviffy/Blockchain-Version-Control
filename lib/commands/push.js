const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const push = new Command('push');

push
  .description('Push local commits to blockchain')
  .option('--gas-price <price>', 'Set gas price in gwei')
  .option('--wait', 'Wait for transaction confirmation')
  .option('--dry-run', 'Simulate push without executing')
  .option('--force', 'Force push (overwrite remote history)')
  .argument('[commit-hash]', 'Specific commit hash to push')
  .action(async (commitHash, options) => {
    const spinner = ora('Preparing to push...').start();
    
    try {
      // Check if we're in a BVC repository
      const bvcDir = path.join(process.cwd(), '.bvc');
      if (!await fs.pathExists(bvcDir)) {
        throw new Error('Not a BVC repository. Run "bvc init" first.');
      }

      // Load repository configuration
      const configPath = path.join(bvcDir, 'config.json');
      const config = await fs.readJson(configPath);

      // Check if blockchain is configured
      const hasBlockchain = config.repoId && config.repoId.length > 0;
      
      if (!hasBlockchain) {
        spinner.stop();
        CLIUtils.warning('Repository is in local-only mode.');
        CLIUtils.info('Push requires blockchain configuration.');
        CLIUtils.info('To enable blockchain features:');
        CLIUtils.info('  1. Run: bvc config --setup');
        CLIUtils.info('  2. Initialize blockchain: bvc init --upgrade-blockchain');
        return;
      }

      // Load local commits
      const commitsPath = path.join(bvcDir, 'commits.json');
      let localCommits = [];
      
      if (await fs.pathExists(commitsPath)) {
        localCommits = await fs.readJson(commitsPath);
      }

      if (localCommits.length === 0) {
        spinner.stop();
        console.log(CLIUtils.colors.muted('No commits to push.'));
        return;
      }

      // Initialize blockchain service
      spinner.text = 'Connecting to blockchain...';
      const blockchain = new BlockchainService();
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
        throw new Error('Blockchain not configured. Run "bvc config --setup" first.');
      }

      const initialized = await blockchain.initialize(userConfigPath);
      if (!initialized) {
        throw new Error('Failed to connect to blockchain.');
      }

      // Get unpushed commits
      spinner.text = 'Checking for unpushed commits...';
      const unpushedCommits = await blockchain.syncLocalCommitsToBlockchain(config.repoId, localCommits);

      if (unpushedCommits.length === 0) {
        spinner.stop();
        console.log(CLIUtils.colors.success('All commits already pushed to blockchain.'));
        return;
      }

      // Filter to specific commit if provided
      let commitsToPush = unpushedCommits;
      if (commitHash) {
        commitsToPush = unpushedCommits.filter(c => c.commitHash.startsWith(commitHash));
        if (commitsToPush.length === 0) {
          throw new Error(`Commit ${commitHash} not found or already pushed.`);
        }
      }

      if (options.dryRun) {
        spinner.stop();
        console.log(CLIUtils.colors.info('Dry run - would push the following commits:'));
        commitsToPush.forEach((commit, index) => {
          console.log(`  ${index + 1}. ${commit.commitHash.substring(0, 8)} - ${commit.message}`);
        });
        return;
      }

      // Push commits to blockchain
      spinner.text = `Pushing ${commitsToPush.length} commit(s) to blockchain...`;
      let pushed = 0;

      for (const commit of commitsToPush) {
        try {
          spinner.text = `Pushing commit ${commit.commitHash.substring(0, 8)}... (${pushed + 1}/${commitsToPush.length})`;
          
          // Upload commit to blockchain
          const receipt = await blockchain.commitToBlockchain(
            config.repoId,
            commit.commitHash,
            commit.ipfsCid || '',
            commit.message
          );

          if (options.wait) {
            spinner.text = `Waiting for confirmation... (${commit.commitHash.substring(0, 8)})`;
            // Receipt already contains confirmation
          }

          pushed++;
        } catch (error) {
          spinner.stop();
          console.log(CLIUtils.colors.error(`Failed to push commit ${commit.commitHash.substring(0, 8)}: ${error.message}`));
          if (!options.force) {
            throw error;
          }
        }
      }

      spinner.stop();

      // Success message
      console.log(CLIUtils.colors.success(`Successfully pushed ${pushed} commit(s) to blockchain!`));
      
      if (pushed > 0) {
        console.log(CLIUtils.box(`
${CLIUtils.icons.blockchain} Repository: ${config.repoId}
${CLIUtils.icons.commit} Commits pushed: ${pushed}
${CLIUtils.icons.hash} Latest: ${commitsToPush[commitsToPush.length - 1].commitHash.substring(0, 8)}`, {
          borderColor: 'green'
        }));

        // Next steps
        CLIUtils.complete('Push completed!', [
          'bvc log  # View updated history',
          'Share repository ID with collaborators'
        ]);
      }

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Push operation');
    }
  });

module.exports = push;
