const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora').default || require('ora');
const CLIUtils = require('../utils/cli');
const BlockchainService = require('../blockchain');

const list = new Command('list');

list
  .description('List all repositories on blockchain')
  .option('--mine', 'Show only repositories owned by configured wallet')
  .option('--detailed', 'Show detailed repository information')
  .option('--local', 'Show local repositories instead of blockchain')
  .action(async (options) => {
    const spinner = ora('Fetching repositories...').start();
    
    try {
      // Check for local repositories first
      if (options.local) {
        spinner.text = 'Scanning for local repositories...';
        // Implementation for local repo listing
        spinner.stop();
        CLIUtils.info('Local repository listing not implemented yet.');
        CLIUtils.info('Use standard file system tools to find .bvc directories.');
        return;
      }

      // Check for blockchain configuration
      const bvcDir = path.join(process.cwd(), '.bvc');
      const currentUserConfig = path.join(bvcDir, 'user-config.json');
      const homeUserConfig = path.join(require('os').homedir(), '.bvc', 'user-config.json');
      
      let userConfigPath = null;
      if (await fs.pathExists(currentUserConfig)) {
        userConfigPath = currentUserConfig;
      } else if (await fs.pathExists(homeUserConfig)) {
        userConfigPath = homeUserConfig;
      } else {
        spinner.stop();
        CLIUtils.warning('Blockchain not configured.');
        CLIUtils.info('To list blockchain repositories:');
        CLIUtils.info('  1. Run: bvc config --setup');
        CLIUtils.info('  2. Try: bvc list');
        CLIUtils.info('To list local repositories:');
        CLIUtils.info('  1. Run: bvc list --local');
        return;
      }

      // Initialize blockchain service
      spinner.text = 'Connecting to blockchain...';
      const blockchain = new BlockchainService();

      const initialized = await blockchain.initialize(userConfigPath);
      if (!initialized) {
        throw new Error('Failed to connect to blockchain.');
      }

      // Get user address for filtering
      let userAddress = null;
      if (options.mine) {
        const userConfig = await fs.readJson(userConfigPath);
        if (userConfig.privateKey) {
          userAddress = blockchain.signer.address.toLowerCase();
        }
      }

      // Fetch all repositories
      spinner.text = 'Fetching repository list...';
      const repositories = await blockchain.getAllRepositories();

      if (repositories.length === 0) {
        spinner.stop();
        console.log(CLIUtils.colors.muted('No repositories found on blockchain.'));
        console.log(CLIUtils.colors.info('Create your first repository with: bvc init <name>'));
        return;
      }

      // Filter repositories if needed
      let filteredRepos = repositories;
      if (options.mine && userAddress) {
        filteredRepos = repositories.filter(repo => 
          repo.owner.toLowerCase() === userAddress
        );
      }

      spinner.stop();

      // Display results
      if (filteredRepos.length === 0) {
        console.log(CLIUtils.colors.muted('No repositories found matching your criteria.'));
        return;
      }

      const title = options.mine ? 'Your Repositories' : 'All Repositories';
      console.log(CLIUtils.colors.boldPrimary(`\n📚 ${title} (${filteredRepos.length} found)`));
      console.log('─'.repeat(80));

      if (options.detailed) {
        // Detailed view
        for (const repo of filteredRepos) {
          const isOwner = userAddress && repo.owner.toLowerCase() === userAddress;
          const ownerIcon = isOwner ? '👑' : '👤';
          
          console.log(CLIUtils.colors.bold(`${CLIUtils.icons.folder} ${repo.name}`));
          console.log(CLIUtils.colors.muted(`   Repository ID: ${repo.id}`));
          console.log(CLIUtils.colors.muted(`   ${ownerIcon} Owner: ${repo.owner}`));
          console.log(CLIUtils.colors.muted(`   📅 Created: ${new Date(repo.createdAt * 1000).toLocaleString()}`));
          
          // Try to get commit count
          try {
            const commits = await blockchain.getCommits(repo.id);
            console.log(CLIUtils.colors.muted(`   📝 Commits: ${commits.length}`));
            
            if (commits.length > 0) {
              const lastCommit = commits[commits.length - 1];
              console.log(CLIUtils.colors.muted(`   🕒 Last commit: ${new Date(lastCommit.timestamp * 1000).toLocaleDateString()}`));
            }
          } catch (error) {
            console.log(CLIUtils.colors.muted(`   📝 Commits: Unable to fetch`));
          }
          
          console.log();
        }
      } else {
        // Simple table view
        const table = CLIUtils.table({
          head: ['Name', 'Repository ID', 'Owner', 'Created'],
          colWidths: [20, 30, 20, 15]
        });

        for (const repo of filteredRepos) {
          const isOwner = userAddress && repo.owner.toLowerCase() === userAddress;
          const ownerDisplay = isOwner ? `👑 ${repo.owner.slice(0, 8)}...` : `${repo.owner.slice(0, 8)}...`;
          const createdDate = new Date(repo.createdAt * 1000).toLocaleDateString();
          
          table.push([
            repo.name,
            repo.id.slice(0, 25) + '...',
            ownerDisplay,
            createdDate
          ]);
        }

        console.log(table.toString());
      }

      // Show helpful information
      console.log(CLIUtils.colors.muted(`\n💡 Tips:`));
      console.log(CLIUtils.colors.muted(`   • Clone a repository: bvc clone <repository-id>`));
      console.log(CLIUtils.colors.muted(`   • View detailed info: bvc list --detailed`));
      if (!options.mine) {
        console.log(CLIUtils.colors.muted(`   • Show only your repos: bvc list --mine`));
      }

    } catch (error) {
      spinner.stop();
      CLIUtils.handleError(error, 'Repository listing');
    }
  });

module.exports = list;
