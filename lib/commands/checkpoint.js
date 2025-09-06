const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const checkpoint = new Command('checkpoint');

checkpoint
  .description('Create a checkpoint to batch multiple commits to blockchain (cost-efficient)')
  .option('--from <commit>', 'Starting commit hash')
  .option('--to <commit>', 'Ending commit hash (default: latest)')
  .option('--message <message>', 'Checkpoint message')
  .option('--dry-run', 'Preview checkpoint without executing (no gas fees)')
  .addHelpText('after', `
Examples:
  $ bvc checkpoint --message "Feature complete"     Batch all commits to blockchain
  $ bvc checkpoint --from abc123 --message "Fix"    Batch commits from specific point
  $ bvc checkpoint --dry-run                        Preview without gas fees

💰 Cost Optimization:
  • Checkpoints batch multiple commits into single blockchain transaction
  • Significantly reduces gas fees compared to individual commit transactions
  • Recommended workflow: local commits → checkpoint → blockchain sync
`)
  .action(async (options) => {
    const spinner = ora('Preparing checkpoint...').start();
    
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
        CLIUtils.info('Checkpoints require blockchain configuration for cost-efficient batch operations.');
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
        throw new Error('No commits found to checkpoint.');
      }

      // Determine commit range
      let fromCommit = options.from;
      let toCommit = options.to || localCommits[localCommits.length - 1].commitHash;

      if (!fromCommit) {
        // Default to first commit
        fromCommit = localCommits[0].commitHash;
      }

      // Find commit indices
      const fromIndex = localCommits.findIndex(c => c.commitHash.startsWith(fromCommit));
      const toIndex = localCommits.findIndex(c => c.commitHash.startsWith(toCommit));

      if (fromIndex === -1) {
        throw new Error(`From commit ${fromCommit} not found.`);
      }
      if (toIndex === -1) {
        throw new Error(`To commit ${toCommit} not found.`);
      }
      if (fromIndex > toIndex) {
        throw new Error('From commit must be before to commit.');
      }

      const commitsInRange = localCommits.slice(fromIndex, toIndex + 1);
      
      console.log(CLIUtils.colors.info(`💰 Preparing checkpoint for ${commitsInRange.length} commit(s)...`));
      console.log(CLIUtils.colors.muted(`💡 This batches ${commitsInRange.length} commits into 1 blockchain transaction (gas efficient)`));

      // Dry run option
      if (options.dryRun) {
        spinner.stop();
        console.log(CLIUtils.colors.info('🔍 Dry run - would checkpoint the following commits:'));
        commitsInRange.forEach((commit, index) => {
          console.log(`  ${index + 1}. ${commit.commitHash.substring(0, 8)} - ${commit.message}`);
        });
        
        const estimatedGas = commitsInRange.length * 10000 + 50000; // Rough estimate
        console.log(CLIUtils.colors.muted(`\n📊 Estimated gas: ~${estimatedGas} units`));
        console.log(CLIUtils.colors.muted(`💵 Compare: Individual commits would cost ~${commitsInRange.length * 80000} gas units`));
        console.log(CLIUtils.colors.success(`🎯 Savings: ~${Math.round((1 - estimatedGas/(commitsInRange.length * 80000)) * 100)}% gas reduction`));
        return;
      }

      // Initialize blockchain service
      spinner.text = 'Connecting to blockchain...';
      const blockchain = new BlockchainService();
      const userConfigPath = path.join(bvcDir, 'user-config.json');
      
      if (!await fs.pathExists(userConfigPath)) {
        throw new Error('Blockchain not configured. Run "bvc config --setup" first.');
      }

      const initialized = await blockchain.initialize(userConfigPath);
      if (!initialized) {
        throw new Error('Failed to connect to blockchain.');
      }

      // Create checkpoint bundle with all files from the range
      spinner.text = 'Creating checkpoint bundle...';
      
      // Collect all unique files from commits in range
      const allFiles = new Map();
      
      for (const commit of commitsInRange) {
        // For simplicity, collect files from working directory
        // In a full implementation, we'd reconstruct the state at each commit
        const files = await collectWorkingDirectoryFiles(process.cwd());
        files.forEach(file => {
          allFiles.set(file.path, file);
        });
      }

      const filesArray = Array.from(allFiles.values());
      
      // Upload bundle to IPFS
      spinner.text = 'Uploading checkpoint bundle to IPFS...';
      const bundleCid = await blockchain.uploadCommitToIPFS(filesArray);

      // Create merkle root for integrity
      const merkleRoot = createMerkleRoot(commitsInRange.map(c => c.commitHash));

      // Record checkpoint on blockchain
      spinner.text = 'Recording checkpoint on blockchain...';
      
      const fromCommitHash = localCommits[fromIndex].commitHash;
      const toCommitHash = localCommits[toIndex].commitHash;
      
      const receipt = await blockchain.contract.checkpoint(
        config.repoId,
        fromCommitHash,
        toCommitHash,
        bundleCid,
        merkleRoot
      );

      await receipt.wait();

      // Save checkpoint locally
      const checkpointsPath = path.join(bvcDir, 'checkpoints.json');
      let checkpoints = [];
      
      if (await fs.pathExists(checkpointsPath)) {
        checkpoints = await fs.readJson(checkpointsPath);
      }

      const newCheckpoint = {
        fromCommit: fromCommitHash,
        toCommit: toCommitHash,
        bundleCid: bundleCid,
        merkleRoot: merkleRoot,
        message: options.message || `Checkpoint: ${commitsInRange.length} commits`,
        timestamp: new Date().toISOString(),
        commitCount: commitsInRange.length
      };

      checkpoints.push(newCheckpoint);
      await fs.writeJson(checkpointsPath, checkpoints, { spaces: 2 });

      spinner.stop();

      // Success message
      console.log(CLIUtils.colors.success('Checkpoint created successfully!'));
      
      console.log(CLIUtils.box(`
${CLIUtils.icons.checkpoint} Checkpoint Bundle: ${bundleCid}
${CLIUtils.icons.commit} Commits batched: ${commitsInRange.length}
${CLIUtils.icons.hash} From: ${fromCommitHash.substring(0, 8)}
${CLIUtils.icons.hash} To: ${toCommitHash.substring(0, 8)}
${CLIUtils.icons.folder} Files: ${filesArray.length}`, {
        borderColor: 'green'
      }));

      // Next steps
      CLIUtils.complete('Checkpoint completed!', [
        'bvc log --checkpoints  # View checkpoint history',
        'Share checkpoint bundle CID for efficient sync'
      ]);

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Checkpoint creation');
    }
  });

// Helper function to collect files from working directory
async function collectWorkingDirectoryFiles(dir) {
  const files = [];
  const bvcDir = path.join(dir, '.bvc');
  
  async function walkDir(currentPath, basePath = '') {
    const items = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);
      const relativePath = path.join(basePath, item.name);
      
      // Skip .bvc directory and other common ignore patterns
      if (item.name === '.bvc' || item.name === '.git' || item.name === 'node_modules') {
        continue;
      }
      
      if (item.isDirectory()) {
        await walkDir(fullPath, relativePath);
      } else {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        files.push({
          path: relativePath,
          hash: hash,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
  }

  await walkDir(dir);
  return files;
}

// Helper function to create a simple merkle root
function createMerkleRoot(hashes) {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];
  
  // Simple implementation - hash all hashes together
  const allHashes = hashes.join('');
  return crypto.createHash('sha256').update(allHashes).digest('hex');
}

module.exports = checkpoint;
