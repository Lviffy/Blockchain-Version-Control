const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const inquirer = require('inquirer').default || require('inquirer');
const BlockchainService = require('../blockchain');
const CLIUtils = require('../utils/cli');

// Function to calculate line differences between two file contents
function calculateLineDiff(oldContent, newContent) {
  if (!oldContent && !newContent) return { additions: 0, deletions: 0, modifications: 0 };
  
  const oldLines = oldContent ? oldContent.toString().split('\n') : [];
  const newLines = newContent ? newContent.toString().split('\n') : [];
  
  // If no old content, all lines are additions
  if (!oldContent || oldLines.length === 0) {
    return { additions: newLines.length, deletions: 0, modifications: 0 };
  }
  
  // If no new content, all lines are deletions
  if (!newContent || newLines.length === 0) {
    return { additions: 0, deletions: oldLines.length, modifications: 0 };
  }
  
  // Simple heuristic: if file sizes are very different, assume mostly additions/deletions
  const sizeDiff = Math.abs(newLines.length - oldLines.length);
  if (sizeDiff > Math.min(oldLines.length, newLines.length) * 0.5) {
    // Significant size change - mostly additions or deletions
    if (newLines.length > oldLines.length) {
      return { additions: sizeDiff, deletions: 0, modifications: oldLines.length };
    } else {
      return { additions: 0, deletions: sizeDiff, modifications: newLines.length };
    }
  }
  
  // For similar sizes, assume some modifications
  const minLines = Math.min(oldLines.length, newLines.length);
  let modifications = 0;
  let additions = Math.max(0, newLines.length - oldLines.length);
  let deletions = Math.max(0, oldLines.length - newLines.length);
  
  // Count actual differences
  for (let i = 0; i < minLines; i++) {
    if (oldLines[i] !== newLines[i]) {
      modifications++;
    }
  }
  
  return { additions, deletions, modifications };
}

// Function to get previous version of a file from commits
async function getPreviousFileVersion(filePath, commits, bvcPath) {
  // Look through commits in reverse order to find the most recent version
  for (let i = commits.length - 1; i >= 0; i--) {
    const commit = commits[i];
    const fileInCommit = commit.files.find(f => f.path === filePath);
    
    if (fileInCommit) {
      // Try to get the file content from IPFS if available
      if (commit.ipfsCid) {
        try {
          const BlockchainService = require('../blockchain');
          const blockchain = new BlockchainService();
          
          // Initialize IPFS service
          const userConfigPath = path.join(bvcPath, 'user-config.json');
          if (await fs.pathExists(userConfigPath)) {
            await blockchain.initialize(userConfigPath);
            
            // Download the commit bundle
            const tempDir = path.join(require('os').tmpdir(), `bvc_temp_${Date.now()}`);
            await fs.ensureDir(tempDir);
            
            await blockchain.ipfs.downloadCommitBundle(commit.ipfsCid, tempDir);
            
            // Read the file from the downloaded bundle
            const downloadedFilePath = path.join(tempDir, filePath);
            if (await fs.pathExists(downloadedFilePath)) {
              const content = await fs.readFile(downloadedFilePath);
              await fs.remove(tempDir); // Clean up
              return content;
            }
            
            await fs.remove(tempDir); // Clean up
          }
        } catch (error) {
          // IPFS retrieval failed, continue to next method
        }
      }
      
      // If IPFS is not available, we can't get the previous version
      // This is a limitation of the current local-only storage approach
      break;
    }
  }
  
  return null; // No previous version found
}

const commit = new Command('commit');

commit
  .description('Create a new commit (local-only by default)')
  .option('-m, --message <message>', 'Commit message')
  .option('--blockchain', 'Force commit to blockchain (not recommended)')
  .option('--amend', 'Amend the last commit')
  .option('--interactive', 'Interactive commit with editor')
  .addHelpText('after', `
Examples:
  $ bvc commit -m "Initial commit"        Create local commit (recommended)
  $ bvc commit --interactive              Interactive commit
  $ bvc commit --blockchain -m "Force"    Force blockchain commit (gas fees)
  $ bvc commit --amend -m "Fixed typo"    Amend last commit

💡 Cost Optimization:
  • All commits are local by default (no gas fees)
  • Use "bvc checkpoint" to batch multiple commits to blockchain
  • Use "bvc push" to sync all local commits to blockchain
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
      
      // Only use blockchain if explicitly requested with --blockchain flag
      if (options.blockchain) {
        spinner.text = 'Connecting to blockchain...';
        CLIUtils.warning('⚠️  Using blockchain for individual commits incurs gas fees!');
        CLIUtils.info('💡 Consider using "bvc checkpoint" for cost-efficient batch operations.');
        
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
              CLIUtils.warning('Blockchain operation failed:', error.message);
              CLIUtils.info('Commit saved locally only');
            }
          }
        } else {
          spinner.warn('Blockchain configuration not found');
          CLIUtils.info('Commit saved locally only');
        }
      } else {
        // Default behavior: local-only commits
        spinner.text = 'Saving commit locally...';
        CLIUtils.info('💾 Commit saved locally (no gas fees)');
        CLIUtils.info('💡 Use "bvc checkpoint" to batch commits to blockchain efficiently');
      }

      spinner.text = 'Saving commit locally...';

      // Calculate line differences for each staged file
      const fileStats = [];
      let totalAdditions = 0;
      let totalDeletions = 0;
      let totalModifications = 0;

      for (const file of staging.files) {
        const filePath = path.join(process.cwd(), file.path);
        
        // Get current file content
        let currentContent = null;
        try {
          currentContent = await fs.readFile(filePath);
        } catch (error) {
          // File might not exist or be readable
          continue;
        }
        
        // Get previous version from staging (previousContent from previous add)
        let previousContent = null;
        if (file.previousContent) {
          try {
            previousContent = Buffer.from(file.previousContent, 'base64');
          } catch (error) {
            // Could not decode previous content
          }
        }
        
        // Calculate differences
        const diff = calculateLineDiff(previousContent, currentContent);
        
        fileStats.push({
          path: file.path,
          additions: diff.additions,
          deletions: diff.deletions,
          modifications: diff.modifications
        });
        
        totalAdditions += diff.additions;
        totalDeletions += diff.deletions;
        totalModifications += diff.modifications;
      }

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
            size: f.size,
            content: f.currentContent // Store content for future diff calculations
          })),
          stats: {
            totalFiles: staging.files.length,
            additions: totalAdditions,
            deletions: totalDeletions,
            modifications: totalModifications,
            fileStats: fileStats
          }
        };

        commits.push(newCommit);
      }

      // Save commits and clear staging
      await fs.writeJson(commitsPath, commits, { spaces: 2 });
      await fs.writeJson(stagingPath, { files: [] }, { spaces: 2 });

      spinner.succeed('Commit created successfully!');

      // Display commit summary
              const changesText = totalAdditions > 0 || totalDeletions > 0 || totalModifications > 0 ? 
                `${CLIUtils.icons.stats} Changes: ${totalAdditions > 0 ? `+${totalAdditions} ` : ''}${totalDeletions > 0 ? `-${totalDeletions} ` : ''}${totalModifications > 0 ? `~${totalModifications}` : ''}`.trim() : 
                `${CLIUtils.icons.stats} Changes: No line changes detected`;
              
              console.log(CLIUtils.box(`
${CLIUtils.icons.commit} Commit Summary

${CLIUtils.icons.hash} Hash: ${commitHash.substring(0, 8)}...
${CLIUtils.icons.file} Files: ${staging.files.length}
${CLIUtils.icons.git} Message: "${commitMessage}"
${changesText}
${blockchainSuccess ? 
  `${CLIUtils.icons.blockchain} Blockchain: Recorded (gas used)` : 
  `${CLIUtils.icons.folder} Storage: Local only (no gas fees)`}
${ipfsCid ? `${CLIUtils.icons.ipfs} IPFS CID: ${ipfsCid}` : `${CLIUtils.icons.ipfs} IPFS CID: Not uploaded`}
`, {
          borderColor: blockchainSuccess ? 'yellow' : 'green'
        }));

      if (staging.files.length > 0) {
        console.log(CLIUtils.colors.muted('\nCommitted files:'));
        staging.files.forEach((file, index) => {
          const stats = fileStats[index];
          const changes = [];
          if (stats.additions > 0) changes.push(`+${stats.additions}`);
          if (stats.deletions > 0) changes.push(`-${stats.deletions}`);
          if (stats.modifications > 0) changes.push(`~${stats.modifications}`);
          
          const changeStr = changes.length > 0 ? ` (${changes.join(', ')})` : '';
          console.log(CLIUtils.colors.muted(`  • ${file.path}${changeStr}`));
        });
      }

      // Next steps
      const nextSteps = [];
      if (blockchainSuccess) {
        nextSteps.push('bvc log  # View commit history');
        nextSteps.push('💡 Consider using local commits + checkpoints for cost efficiency');
      } else {
        nextSteps.push('Continue making local commits (no gas fees)');
        nextSteps.push('bvc checkpoint --message "Batch description"  # Efficient blockchain sync');
        nextSteps.push('bvc log  # View commit history');
      }

      if (nextSteps.length > 0) {
        CLIUtils.complete('', nextSteps);
      }

    } catch (error) {
      CLIUtils.handleError(error, 'Commit creation');
    }
  });

module.exports = commit;
