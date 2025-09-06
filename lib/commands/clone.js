const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const clone = new Command('clone');

clone
  .description('Clone an existing repository from blockchain/IPFS')
  .option('--commit <hash>', 'Clone specific commit')
  .option('--depth <number>', 'Shallow clone with limited history', parseInt)
  .option('--branch <name>', 'Clone specific branch (if supported)')
  .argument('<repo-id>', 'Repository ID to clone')
  .argument('[directory]', 'Target directory (default: repo name)')
  .action(async (repoId, directory, options) => {
    const spinner = ora('Preparing to clone...').start();
    
    try {
      // Initialize blockchain service first
      spinner.text = 'Connecting to blockchain...';
      const blockchain = new BlockchainService();
      
      // Check for user config in current directory
      const currentUserConfig = path.join(process.cwd(), '.bvc', 'user-config.json');
      const homeUserConfig = path.join(require('os').homedir(), '.bvc', 'user-config.json');
      const parentUserConfig = path.join(process.cwd(), '..', '.bvc', 'user-config.json');
      
      let userConfigPath = null;
      if (await fs.pathExists(currentUserConfig)) {
        userConfigPath = currentUserConfig;
      } else if (await fs.pathExists(homeUserConfig)) {
        userConfigPath = homeUserConfig;
      } else if (await fs.pathExists(parentUserConfig)) {
        userConfigPath = parentUserConfig;
      } else {
        throw new Error('Blockchain not configured. Run "bvc config --setup" first.');
      }

      const initialized = await blockchain.initialize(userConfigPath);
      if (!initialized) {
        throw new Error('Failed to connect to blockchain.');
      }

      // Fetch repository info
      spinner.text = 'Fetching repository information...';
      let repository;
      try {
        repository = await blockchain.getRepository(repoId);
        if (!repository.exists) {
          throw new Error('Repository does not exist');
        }
      } catch (error) {
        throw new Error(`Repository ${repoId} not found on blockchain.`);
      }

      // Determine target directory
      const targetDir = directory || repository.name || repoId.split('-')[0];
      const fullTargetPath = path.resolve(process.cwd(), targetDir);

      // Check if target directory already exists
      if (await fs.pathExists(fullTargetPath)) {
        const stat = await fs.stat(fullTargetPath);
        if (stat.isDirectory()) {
          const items = await fs.readdir(fullTargetPath);
          if (items.length > 0) {
            throw new Error(`Directory ${targetDir} already exists and is not empty.`);
          }
        } else {
          throw new Error(`${targetDir} already exists and is not a directory.`);
        }
      }

      // Create target directory and .bvc structure
      await fs.ensureDir(fullTargetPath);
      const bvcDir = path.join(fullTargetPath, '.bvc');
      await fs.ensureDir(bvcDir);

      // Fetch commits from blockchain
      spinner.text = 'Fetching commit history...';
      const blockchainCommits = await blockchain.getCommits(repoId);

      if (blockchainCommits.length === 0) {
        throw new Error('Repository has no commits.');
      }

      // Filter commits based on options
      let commitsToClone = blockchainCommits;
      
      if (options.commit) {
        const targetCommit = blockchainCommits.find(c => 
          c.commitHash.startsWith(options.commit)
        );
        if (!targetCommit) {
          throw new Error(`Commit ${options.commit} not found.`);
        }
        // For specific commit, clone up to that commit
        const commitIndex = blockchainCommits.findIndex(c => c.commitHash === targetCommit.commitHash);
        commitsToClone = blockchainCommits.slice(0, commitIndex + 1);
      } else if (options.depth) {
        // Shallow clone - take last N commits
        commitsToClone = blockchainCommits.slice(-options.depth);
      }

      console.log(CLIUtils.colors.info(`Cloning ${commitsToClone.length} commit(s)...`));

      // Download and restore files from each commit
      let clonedCommits = 0;
      const allFiles = new Set();

      for (const commit of commitsToClone) {
        try {
          spinner.text = `Cloning commit ${commit.commitHash.substring(0, 8)}... (${clonedCommits + 1}/${commitsToClone.length})`;
          
          // Download files from IPFS if CID exists
          if (commit.ipfsCid && commit.ipfsCid !== '' && !commit.ipfsCid.startsWith('mock_')) {
            try {
              const downloadedFiles = await blockchain.downloadCommitFromIPFS(
                commit.ipfsCid, 
                fullTargetPath
              );
              
              if (downloadedFiles && downloadedFiles.length > 0) {
                downloadedFiles.forEach(file => allFiles.add(file.path));
              }
            } catch (downloadError) {
              console.warn(CLIUtils.colors.warning(`Failed to download files for commit ${commit.commitHash.substring(0, 8)}: ${downloadError.message}`));
            }
          }

          clonedCommits++;
        } catch (error) {
          console.warn(CLIUtils.colors.warning(`Failed to clone commit ${commit.commitHash.substring(0, 8)}: ${error.message}`));
        }
      }

      // Create repository configuration
      const config = {
        repoId: repoId,
        name: repository.name,
        owner: repository.owner,
        createdAt: new Date(repository.createdAt * 1000).toISOString(),
        clonedAt: new Date().toISOString(),
        clonedFrom: repoId,
        originalOwner: repository.owner
      };

      await fs.writeJson(path.join(bvcDir, 'config.json'), config, { spaces: 2 });

      // Convert and save commits in local format
      const localCommits = commitsToClone.map(commit => ({
        commitHash: commit.commitHash,
        parentHash: commit.parentHash,
        message: commit.message,
        timestamp: new Date(commit.timestamp * 1000).toISOString(),
        author: commit.author,
        ipfsCid: commit.ipfsCid || ''
      }));

      await fs.writeJson(path.join(bvcDir, 'commits.json'), localCommits, { spaces: 2 });

      // Copy user configuration
      if (userConfigPath) {
        const userConfig = await fs.readJson(userConfigPath);
        await fs.writeJson(path.join(bvcDir, 'user-config.json'), userConfig, { spaces: 2 });
      }

      // Initialize staging area
      await fs.writeJson(path.join(bvcDir, 'staging.json'), { files: [] }, { spaces: 2 });

      spinner.stop();

      // Success message
      console.log(CLIUtils.colors.success(`Successfully cloned repository!`));
      
      console.log(CLIUtils.box(`
${CLIUtils.icons.blockchain} Repository: ${repository.name}
${CLIUtils.icons.folder} Directory: ${targetDir}
${CLIUtils.icons.commit} Commits: ${clonedCommits}
${CLIUtils.icons.download} Files: ${allFiles.size}
${CLIUtils.icons.user} Owner: ${repository.owner}`, {
        borderColor: 'green'
      }));

      if (allFiles.size > 0) {
        console.log(CLIUtils.colors.muted('\nCloned files:'));
        Array.from(allFiles).slice(0, 10).forEach(file => {
          console.log(CLIUtils.colors.muted(`  • ${file}`));
        });
        if (allFiles.size > 10) {
          console.log(CLIUtils.colors.muted(`  ... and ${allFiles.size - 10} more files`));
        }
      }

      // Next steps
      CLIUtils.complete('Clone completed!', [
        `cd ${targetDir}  # Enter the repository`,
        'bvc log  # View commit history',
        'bvc status  # Check repository status'
      ]);

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Clone operation');
    }
  });

module.exports = clone;
