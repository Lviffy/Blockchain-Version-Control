const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../utils/cli');

const log = new Command('log');

log
  .description('View commit history')
  .option('--oneline', 'Show each commit on a single line')
  .option('--graph', 'Show ASCII art commit graph')
  .option('-n, --max-count <number>', 'Limit number of commits to show', '10')
  .option('--since <date>', 'Show commits since date')
  .option('--author <name>', 'Show commits by specific author')
  .addHelpText('after', `
Examples:
  $ bvc log                          Show recent commit history  
  $ bvc log --oneline                Compact one-line format
  $ bvc log -n 5                     Show last 5 commits
  $ bvc log --author "John"          Show commits by John
  $ bvc log --since "2023-01-01"     Show commits since date
`)
  .action(async (options) => {
    try {
      const bvcPath = await CLIUtils.validateBVCRepo(fs, path);
      const commitsPath = path.join(bvcPath, 'commits.json');
      const configPath = path.join(bvcPath, 'config.json');

      let commits = await fs.readJson(commitsPath);
      const config = await fs.readJson(configPath);

      if (commits.length === 0) {
        CLIUtils.info('No commits yet');
        CLIUtils.info('Create your first commit with: bvc add <files> && bvc commit -m "Initial commit"');
        return;
      }

      // Apply filters
      if (options.author) {
        commits = commits.filter(commit => 
          commit.author && commit.author.toLowerCase().includes(options.author.toLowerCase())
        );
      }

      if (options.since) {
        const sinceDate = new Date(options.since);
        commits = commits.filter(commit => new Date(commit.timestamp) >= sinceDate);
      }

      // Limit number of commits
      const maxCount = parseInt(options.maxCount);
      if (maxCount > 0) {
        commits = commits.slice(-maxCount);
      }

      commits = commits.reverse(); // Show newest first

      if (commits.length === 0) {
        CLIUtils.info('No commits found matching your criteria');
        return;
      }

      // Display header
      console.log(CLIUtils.colors.boldPrimary(`\n📜 Commit History (${commits.length} commit${commits.length !== 1 ? 's' : ''})`));
      console.log(CLIUtils.colors.muted(`Repository: ${config.name || 'Unnamed'}`));
      console.log('─'.repeat(60));

      if (options.oneline) {
        // One-line format
        commits.forEach((commit, index) => {
          const isLatest = index === 0;
          const prefix = isLatest ? CLIUtils.icons.success : CLIUtils.icons.git;
          const hash = commit.commitHash ? commit.commitHash.slice(0, 8) : 'unknown';
          const message = commit.message || 'No message';
          const author = commit.author || 'Unknown';
          const date = commit.timestamp ? new Date(commit.timestamp).toLocaleDateString() : '';
          
          console.log(`${prefix} ${CLIUtils.colors.primary(hash)} ${CLIUtils.colors.muted('(')}${CLIUtils.colors.muted(author)}${CLIUtils.colors.muted(')')} ${message} ${CLIUtils.colors.dim(date)}`);
        });
      } else {
        // Full format
        commits.forEach((commit, index) => {
          const isLatest = index === 0;
          const prefix = isLatest ? CLIUtils.icons.success : CLIUtils.icons.git;
          const hash = commit.commitHash ? commit.commitHash.slice(0, 8) : 'unknown';
          
          console.log(CLIUtils.colors.bold(`${prefix} Commit ${hash}${isLatest ? ' (HEAD)' : ''}`));
          
          if (commit.parentHash) {
            console.log(CLIUtils.colors.muted(`   Parent: ${commit.parentHash.slice(0, 8)}`));
          }
          
          console.log(CLIUtils.colors.primary(`   ${commit.message || 'No message'}`));
          console.log(CLIUtils.colors.muted(`   Author: ${commit.author || 'Unknown'}`));
          console.log(CLIUtils.colors.muted(`   Date: ${commit.timestamp ? new Date(commit.timestamp).toLocaleString() : 'Unknown'}`));
          
          if (commit.ipfsCid) {
            console.log(CLIUtils.colors.muted(`   IPFS: ${commit.ipfsCid}`));
          }
          
          if (commit.blockchainRecorded) {
            console.log(CLIUtils.colors.success(`   ${CLIUtils.icons.blockchain} Recorded on blockchain`));
          }

          if (commit.files && commit.files.length > 0) {
            console.log(CLIUtils.colors.muted(`   Files: ${commit.files.length} file${commit.files.length !== 1 ? 's' : ''}`));
            
            // Show first few files
            const filesToShow = commit.files.slice(0, 3);
            filesToShow.forEach(file => {
              const size = file.size ? ` (${Math.round(file.size / 1024)} KB)` : '';
              console.log(CLIUtils.colors.dim(`     • ${file.path}${size}`));
            });
            
            if (commit.files.length > 3) {
              console.log(CLIUtils.colors.dim(`     ... and ${commit.files.length - 3} more file${commit.files.length - 3 !== 1 ? 's' : ''}`));
            }
          }
          
          if (index < commits.length - 1) {
            console.log();
          }
        });
      }

      console.log();

      // Show helpful information
      if (commits.length === maxCount && !options.author && !options.since) {
        CLIUtils.info(`Showing last ${maxCount} commits. Use -n <number> to show more`);
      }

      // Show summary stats
      const totalFiles = commits.reduce((sum, commit) => sum + (commit.files ? commit.files.length : 0), 0);
      const blockchainCommits = commits.filter(c => c.blockchainRecorded).length;
      
      console.log(CLIUtils.colors.muted(`📊 Summary: ${totalFiles} files tracked, ${blockchainCommits}/${commits.length} commits on blockchain`));

    } catch (error) {
      CLIUtils.handleError(error, 'Log display');
    }
  });

module.exports = log;
