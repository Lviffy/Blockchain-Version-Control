const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const pull = new Command('pull');

pull
  .description('Fetch latest commits from blockchain/IPFS')
  .option('--no-merge', 'Fetch without merging')
  .option('--force', 'Force pull (overwrite local changes)')
  .option('--verify', 'Verify IPFS content integrity')
  .argument('[commit-hash]', 'Specific commit hash to pull')
  .argument('[repo-id]', 'Repository ID to pull from')
  .action(async (commitHash, repoId, options) => {
    const spinner = ora('Preparing to pull...').start();
    
    try {
      // Check if we're in a BVC repository
      const bvcDir = path.join(process.cwd(), '.bvc');
      if (!await fs.pathExists(bvcDir)) {
        throw new Error('Not a BVC repository. Run "bvc init" first.');
      }

      // Load repository configuration
      const configPath = path.join(bvcDir, 'config.json');
      const config = await fs.readJson(configPath);

      // Use provided repo ID or current repo
      const targetRepoId = repoId || config.repoId;
      
      // Check if blockchain is configured
      const hasBlockchain = targetRepoId && targetRepoId.length > 0;
      
      if (!hasBlockchain) {
        spinner.stop();
        CLIUtils.warning('Repository is in local-only mode.');
        CLIUtils.info('Pull requires blockchain configuration.');
        CLIUtils.info('To enable blockchain features:');
        CLIUtils.info('  1. Run: bvc config --setup');
        CLIUtils.info('  2. Initialize blockchain: bvc init --upgrade-blockchain');
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

      // Fetch commits from blockchain
      spinner.text = 'Fetching commits from blockchain...';
      const blockchainCommits = await blockchain.getCommits(targetRepoId);

      if (blockchainCommits.length === 0) {
        spinner.stop();
        console.log(CLIUtils.colors.muted('No commits found on blockchain.'));
        return;
      }

      // Load local commits for comparison
      const commitsPath = path.join(bvcDir, 'commits.json');
      let localCommits = [];
      
      if (await fs.pathExists(commitsPath)) {
        localCommits = await fs.readJson(commitsPath);
      }

      const localHashes = new Set(localCommits.map(c => c.commitHash));
      
      // Find new commits
      let newCommits = blockchainCommits.filter(commit => 
        !localHashes.has(commit.commitHash)
      );

      // Filter to specific commit if provided
      if (commitHash) {
        newCommits = newCommits.filter(c => c.commitHash.startsWith(commitHash));
        if (newCommits.length === 0) {
          throw new Error(`Commit ${commitHash} not found or already exists locally.`);
        }
      }

      if (newCommits.length === 0) {
        spinner.stop();
        console.log(CLIUtils.colors.success('Already up to date.'));
        return;
      }

      console.log(CLIUtils.colors.info(`Found ${newCommits.length} new commit(s) to pull.`));

      // Download and merge commits
      let pulled = 0;
      const pulledFiles = [];

      for (const commit of newCommits) {
        try {
          spinner.text = `Pulling commit ${commit.commitHash.substring(0, 8)}... (${pulled + 1}/${newCommits.length})`;
          
          // Download files from IPFS if CID exists
          if (commit.ipfsCid && commit.ipfsCid !== '' && !commit.ipfsCid.startsWith('mock_')) {
            spinner.text = `Downloading files for commit ${commit.commitHash.substring(0, 8)}...`;
            
            try {
              const downloadedFiles = await blockchain.downloadCommitFromIPFS(
                commit.ipfsCid, 
                process.cwd()
              );
              
              if (downloadedFiles && downloadedFiles.length > 0) {
                pulledFiles.push(...downloadedFiles);
                
                // Verify integrity if requested
                if (options.verify) {
                  spinner.text = `Verifying file integrity...`;
                  for (const file of downloadedFiles) {
                    if (file.hash) {
                      const verified = await blockchain.ipfs.verifyFileIntegrity(file.fullPath, file.hash);
                      if (!verified) {
                        console.warn(CLIUtils.colors.warning(`File integrity check failed: ${file.path}`));
                      }
                    }
                  }
                }
              }
            } catch (downloadError) {
              console.warn(CLIUtils.colors.warning(`Failed to download files for commit ${commit.commitHash.substring(0, 8)}: ${downloadError.message}`));
            }
          }

          // Add to local commits (convert blockchain format)
          const localCommit = {
            commitHash: commit.commitHash,
            parentHash: commit.parentHash,
            message: commit.message,
            timestamp: new Date(commit.timestamp * 1000).toISOString(),
            author: commit.author,
            ipfsCid: commit.ipfsCid || ''
          };

          localCommits.push(localCommit);
          pulled++;

        } catch (error) {
          spinner.stop();
          console.log(CLIUtils.colors.error(`Failed to pull commit ${commit.commitHash.substring(0, 8)}: ${error.message}`));
          if (!options.force) {
            throw error;
          }
        }
      }

      // Save updated commits
      if (pulled > 0 && !options.noMerge) {
        await fs.writeJson(commitsPath, localCommits, { spaces: 2 });
      }

      spinner.stop();

      // Success message
      console.log(CLIUtils.colors.success(`Successfully pulled ${pulled} commit(s) from blockchain!`));
      
      if (pulled > 0) {
        console.log(CLIUtils.box(`
${CLIUtils.icons.blockchain} Repository: ${targetRepoId}
${CLIUtils.icons.commit} Commits pulled: ${pulled}
${CLIUtils.icons.download} Files downloaded: ${pulledFiles.length}
${CLIUtils.icons.hash} Latest: ${newCommits[newCommits.length - 1].commitHash.substring(0, 8)}`, {
          borderColor: 'green'
        }));

        if (pulledFiles.length > 0) {
          console.log(CLIUtils.colors.muted('\nDownloaded files:'));
          pulledFiles.forEach(file => {
            console.log(CLIUtils.colors.muted(`  • ${file.path}`));
          });
        }

        // Next steps
        const nextSteps = ['bvc log  # View updated history'];
        if (options.noMerge) {
          nextSteps.unshift('bvc status  # Review changes before merging');
        }
        
        CLIUtils.complete('Pull completed!', nextSteps);
      }

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Pull operation');
    }
  });

module.exports = pull;
