const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../utils/cli');

const status = new Command('status');

status
  .description('Show repository status')
  .option('--verbose', 'Show detailed status information')
  .addHelpText('after', `
Examples:
  $ bvc status                Show current repository status
  $ bvc status --verbose      Show detailed status with file info
`)
  .action(async (options) => {
    try {
      const bvcPath = await CLIUtils.validateBVCRepo(fs, path);
      const stagingPath = path.join(bvcPath, 'staging.json');
      const configPath = path.join(bvcPath, 'config.json');
      const commitsPath = path.join(bvcPath, 'commits.json');

      // Load repository data
      let staging = { files: [] };
      let config = {};
      let commits = [];

      if (await fs.pathExists(stagingPath)) {
        staging = await fs.readJson(stagingPath);
      }

      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }

      if (await fs.pathExists(commitsPath)) {
        commits = await fs.readJson(commitsPath);
      }

      // Display status using CLIUtils
      CLIUtils.displayStatus(staging, {
        name: config.name,
        branch: config.branch || 'main',
        repoId: config.repoId
      });

      if (options.verbose) {
        console.log(CLIUtils.colors.boldPrimary('📋 Repository Details'));
        console.log('─'.repeat(40));
        
        const table = CLIUtils.table(['Property', 'Value']);
        table.push(
          ['Name', config.name || 'Unknown'],
          ['Description', config.description || 'No description'],
          ['Created', config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'Unknown'],
          ['Blockchain ID', config.repoId || 'Local only'],
          ['Branch', config.branch || 'main'],
          ['Total Commits', commits.length.toString()],
          ['Staged Files', staging.files.length.toString()]
        );
        
        console.log(table.toString());
        console.log();

        if (staging.files.length > 0) {
          console.log(CLIUtils.colors.boldPrimary('📄 Staged File Details'));
          console.log('─'.repeat(40));
          
          const fileTable = CLIUtils.table(['File', 'Size', 'Hash']);
          staging.files.forEach(file => {
            const size = file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown';
            const hash = file.hash ? file.hash.slice(0, 8) + '...' : 'Unknown';
            fileTable.push([file.path, size, hash]);
          });
          
          console.log(fileTable.toString());
          console.log();
        }

        if (commits.length > 0) {
          const lastCommit = commits[commits.length - 1];
          console.log(CLIUtils.colors.boldPrimary('📝 Last Commit'));
          console.log('─'.repeat(40));
          console.log(CLIUtils.colors.muted(`Hash: ${lastCommit.hash || 'Unknown'}`));
          console.log(CLIUtils.colors.muted(`Message: ${lastCommit.message || 'No message'}`));
          console.log(CLIUtils.colors.muted(`Author: ${lastCommit.author || 'Unknown'}`));
          console.log(CLIUtils.colors.muted(`Date: ${lastCommit.timestamp ? new Date(lastCommit.timestamp).toLocaleString() : 'Unknown'}`));
          console.log();
        }
      }

      // Provide helpful hints
      if (staging.files.length === 0) {
        CLIUtils.info('No changes staged for commit');
        console.log(CLIUtils.colors.muted('  Add files with: bvc add <file>'));
      } else {
        CLIUtils.info(`${staging.files.length} file${staging.files.length > 1 ? 's' : ''} staged for commit`);
        console.log(CLIUtils.colors.muted('  Commit with: bvc commit -m "Your message"'));
      }

    } catch (error) {
      CLIUtils.handleError(error, 'Status check');
    }
  });

module.exports = status;
