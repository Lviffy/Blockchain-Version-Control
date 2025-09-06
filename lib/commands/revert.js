const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const revert = new Command('revert');

revert
  .description('Revert to a specific commit version')
  .argument('<commit-hash>', 'Commit hash to revert to')
  .option('--force', 'Force revert (overwrite uncommitted changes)')
  .option('--no-backup', 'Skip creating backup of current state')
  .action(async (commitHash, options) => {
    const spinner = ora('Preparing to revert...').start();

    try {
      // Validate BVC repository
      const bvcPath = await CLIUtils.validateBVCRepo(fs, path);
      const commitsPath = path.join(bvcPath, 'commits.json');
      const configPath = path.join(bvcPath, 'config.json');
      const stagingPath = path.join(bvcPath, 'staging.json');

      // Load repository data
      const commits = await fs.readJson(commitsPath);
      const config = await fs.readJson(configPath);

      // Find the target commit
      const targetCommit = commits.find(c =>
        c.commitHash.startsWith(commitHash) ||
        c.commitHash === commitHash
      );

      if (!targetCommit) {
        spinner.stop();
        CLIUtils.error(`Commit ${commitHash} not found`);
        CLIUtils.info('Use "bvc log" to see available commits');
        process.exit(1);
      }

      // Check for uncommitted changes
      const staging = await fs.readJson(stagingPath);
      if (staging.files.length > 0 && !options.force) {
        spinner.stop();
        CLIUtils.warning('You have staged changes that will be lost on revert.');
        CLIUtils.info('Use --force to override or commit/stash your changes first.');
        process.exit(1);
      }

      // Check for uncommitted file changes
      const hasUncommittedChanges = await checkForUncommittedChanges(process.cwd(), targetCommit);
      if (hasUncommittedChanges && !options.force) {
        spinner.stop();
        CLIUtils.warning('You have uncommitted file changes that will be overwritten.');
        CLIUtils.info('Use --force to override or commit your changes first.');
        process.exit(1);
      }

      spinner.text = `Reverting to commit ${targetCommit.commitHash.substring(0, 8)}...`;

      // Create backup if requested
      if (!options.noBackup) {
        spinner.text = 'Creating backup of current state...';
        await createBackup(bvcPath, targetCommit.commitHash);
      }

      // Initialize blockchain service for IPFS download
      let blockchain = null;
      let useBlockchain = false;

      if (targetCommit.ipfsCid && targetCommit.ipfsCid !== '') {
        const userConfigPath = path.join(bvcPath, 'user-config.json');
        const homeUserConfig = path.join(require('os').homedir(), '.bvc', 'user-config.json');

        let foundConfig = null;
        if (await fs.pathExists(userConfigPath)) {
          foundConfig = userConfigPath;
        } else if (await fs.pathExists(homeUserConfig)) {
          foundConfig = homeUserConfig;
        }

        if (foundConfig) {
          blockchain = new BlockchainService();
          const initialized = await blockchain.initialize(foundConfig);
          if (initialized) {
            useBlockchain = true;
          }
        }
      }

      // Restore files from the target commit
      let restoredFiles = [];

      if (useBlockchain && targetCommit.ipfsCid && !targetCommit.ipfsCid.startsWith('mock_')) {
        spinner.text = 'Downloading files from IPFS...';
        try {
          const downloadedFiles = await blockchain.downloadCommitFromIPFS(
            targetCommit.ipfsCid,
            process.cwd()
          );
          if (downloadedFiles && downloadedFiles.length > 0) {
            restoredFiles = downloadedFiles;
          } else {
            useBlockchain = false;
          }
        } catch (error) {
          spinner.warn('IPFS download failed, trying local content...');
          useBlockchain = false;
        }
      }

      // Fallback to local content if IPFS download failed or not available
      if (!useBlockchain || restoredFiles.length === 0) {
        spinner.text = 'Restoring from local commit data...';
        restoredFiles = await restoreFromLocalCommit(targetCommit, process.cwd());
      }

      // Update repository state
      spinner.text = 'Updating repository state...';

      // Clear staging
      await fs.writeJson(stagingPath, { files: [] }, { spaces: 2 });

      // Update HEAD to point to target commit
      const headPath = path.join(bvcPath, 'HEAD');
      await fs.writeJson(headPath, {
        currentCommit: targetCommit.commitHash,
        lastRevert: new Date().toISOString()
      }, { spaces: 2 });

      spinner.succeed('Revert completed successfully!');

      // Display revert summary
      console.log(CLIUtils.box(`
${CLIUtils.icons.revert} Revert Summary

${CLIUtils.icons.hash} Commit: ${targetCommit.commitHash.substring(0, 8)}...
${CLIUtils.icons.file} Files restored: ${restoredFiles.length}
${CLIUtils.icons.message} Message: "${targetCommit.message}"
${CLIUtils.icons.time} Timestamp: ${new Date(targetCommit.timestamp).toLocaleString()}
${useBlockchain ? `${CLIUtils.icons.ipfs} Source: IPFS (${targetCommit.ipfsCid})` : `${CLIUtils.icons.folder} Source: Local storage`}
`, {
        borderColor: 'yellow'
      }));

      if (restoredFiles.length > 0) {
        console.log(CLIUtils.colors.muted('\nRestored files:'));
        restoredFiles.slice(0, 10).forEach(file => {
          console.log(CLIUtils.colors.muted(`  • ${file.path}`));
        });
        if (restoredFiles.length > 10) {
          console.log(CLIUtils.colors.muted(`  ... and ${restoredFiles.length - 10} more files`));
        }
      }

      // Show next steps
      console.log(CLIUtils.colors.muted('\nNext steps:'));
      console.log(CLIUtils.colors.muted('  • Review the changes: bvc status'));
      console.log(CLIUtils.colors.muted('  • Make new commits: bvc add . && bvc commit -m "message"'));

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Revert failed');
    }
  });

async function checkForUncommittedChanges(workingDir, targetCommit) {
  // This is a simplified check - in a real implementation you'd compare working directory
  // with the target commit's file states
  return false; // For now, assume no uncommitted changes
}

async function createBackup(bvcPath, commitHash) {
  const backupDir = path.join(bvcPath, 'backups');
  await fs.ensureDir(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${commitHash.substring(0, 8)}-${timestamp}`);

  // Copy current working directory state
  const workingDir = path.dirname(bvcPath);
  const files = await fs.readdir(workingDir);

  for (const file of files) {
    if (file !== '.bvc' && file !== 'node_modules') {
      const srcPath = path.join(workingDir, file);
      const destPath = path.join(backupPath, file);
      await fs.copy(srcPath, destPath);
    }
  }

  return backupPath;
}

async function restoreFromLocalCommit(commit, workingDir) {
  const restoredFiles = [];

  if (!commit.files || commit.files.length === 0) {
    return restoredFiles;
  }

  for (const file of commit.files) {
    const filePath = path.join(workingDir, file.path);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));

    // Restore file content
    if (file.content) {
      const content = Buffer.from(file.content, 'base64');
      await fs.writeFile(filePath, content);
    } else {
      // If no content stored, create empty file
      await fs.writeFile(filePath, '');
    }

    restoredFiles.push({
      path: file.path,
      hash: file.hash,
      size: file.size,
      fullPath: filePath
    });
  }

  return restoredFiles;
}

module.exports = revert;
