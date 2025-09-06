#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../lib/utils/cli');
const packageJson = require('../package.json');

// Import commands
const initCommand = require('../lib/commands/init');
const addCommand = require('../lib/commands/add');
const commitCommand = require('../lib/commands/commit');
const statusCommand = require('../lib/commands/status');
const logCommand = require('../lib/commands/log');
const pushCommand = require('../lib/commands/push');
const pullCommand = require('../lib/commands/pull');
const cloneCommand = require('../lib/commands/clone');
const configCommand = require('../lib/commands/config');
const checkpointCommand = require('../lib/commands/checkpoint');
const listCommand = require('../lib/commands/list');

// Create setup command
const setupCommand = new Command('setup');
setupCommand
  .description('Interactive setup wizard for new users')
  .action(async () => {
    console.log(CLIUtils.colors.boldPrimary('🚀 Welcome to Blockchain Version Control!'));
    console.log(CLIUtils.colors.muted('Let\'s get you set up in a few easy steps.\n'));
    
    // Step 1: Check if already configured
    const homeConfig = path.join(require('os').homedir(), '.bvc', 'user-config.json');
    if (await fs.pathExists(homeConfig)) {
      const { reconfigure } = await CLIUtils.confirm('BVC is already configured. Reconfigure?', false);
      if (!reconfigure) {
        CLIUtils.info('Setup cancelled. You can run "bvc help" for available commands.');
        return;
      }
    }
    
    // Step 2: Run config setup
    console.log(CLIUtils.colors.boldPrimary('\n📋 Step 1: Blockchain Configuration'));
    console.log(CLIUtils.colors.muted('We need to connect to your blockchain wallet.\n'));
    
    const { runConfig } = await CLIUtils.confirm('Run blockchain configuration now?', true);
    if (runConfig) {
      // Import and run config command
      const configCmd = require('../lib/commands/config');
      await configCmd.parseAsync(['--setup'], { from: 'user' });
    }
    
    // Step 3: Create first repository
    console.log(CLIUtils.colors.boldPrimary('\n📁 Step 2: Create Your First Repository'));
    console.log(CLIUtils.colors.muted('Let\'s create your first BVC repository.\n'));
    
    const { createRepo } = await CLIUtils.confirm('Create a new repository now?', true);
    if (createRepo) {
      const repoName = await CLIUtils.input('Repository name:', 'my-first-repo');
      const initCmd = require('../lib/commands/init');
      await initCmd.parseAsync([repoName], { from: 'user' });
    }
    
    // Step 4: Show next steps
    console.log(CLIUtils.colors.gradient.rainbow('\n🎉 Setup Complete!'));
    console.log(CLIUtils.colors.dim('═'.repeat(40)));
    
    CLIUtils.infoPanel('Useful Commands', [
      { label: 'bvc status', value: 'Check repository status' },
      { label: 'bvc add .', value: 'Stage all files' },
      { label: 'bvc commit -m "msg"', value: 'Create a commit' },
      { label: 'bvc push', value: 'Push to blockchain' },
      { label: 'bvc help', value: 'Get help' }
    ], { icon: CLIUtils.icons.gem });
    
    CLIUtils.celebrate('Happy coding with BVC!', 'Your decentralized version control system is ready! 🚀');
  });

const program = new Command();

// Global error handler
process.on('uncaughtException', (error) => {
  CLIUtils.handleError(error, 'Uncaught Exception');
});

process.on('unhandledRejection', (error) => {
  CLIUtils.handleError(error, 'Unhandled Promise Rejection');
});

// Check for updates (only for main commands, not help)
async function checkForUpdates() {
  if (program.args.includes('help') || program.args.length === 0) return;
  
  try {
    const https = require('https');
    const currentVersion = packageJson.version;
    
    const options = {
      hostname: 'registry.npmjs.org',
      path: '/bvc-eth',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const npmData = JSON.parse(data);
          const latestVersion = npmData['dist-tags'].latest;
          
          if (latestVersion && CLIUtils.compareVersions(latestVersion, currentVersion) > 0) {
            console.log(CLIUtils.colors.warning(`📦 Update available: ${currentVersion} → ${latestVersion}`));
            console.log(CLIUtils.colors.muted('  Run: npm update -g bvc-eth\n'));
          }
        } catch (e) {
          // Silently ignore update check errors
        }
      });
    });
    
    req.on('error', () => {
      // Silently ignore network errors
    });
    
    req.setTimeout(2000, () => req.destroy());
    req.end();
  } catch (error) {
    // Silently ignore update check errors
  }
}

program
  .name('bvc')
  .description(CLIUtils.colors.primary('🔗 Blockchain Version Control - Decentralized Git powered by blockchain and IPFS'))
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--debug', 'Enable debug mode')
  .option('-y, --yes', 'Skip confirmation prompts')
  .hook('preAction', async (thisCommand, actionCommand) => {
    // Set debug mode if requested
    if (program.opts().debug) {
      process.env.DEBUG = 'true';
    }
    
    // Set non-interactive mode
    if (program.opts().yes) {
      process.env.BVC_NON_INTERACTIVE = 'true';
    }
    
    // Check for updates
    await checkForUpdates();
    
    // Show banner for main commands (not for help)
    if (actionCommand.name() !== 'help' && !actionCommand.parent) {
      CLIUtils.showBanner();
    }
  });

// Register commands with enhanced descriptions
program.addCommand(setupCommand);
program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(commitCommand);
program.addCommand(statusCommand);
program.addCommand(logCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(cloneCommand);
program.addCommand(configCommand);
program.addCommand(checkpointCommand);
program.addCommand(listCommand);

// Add command aliases for better UX
program.alias('st', 'status');
program.alias('ci', 'commit');
program.alias('co', 'checkout'); // if implemented
program.alias('ls', 'list');

// Custom help command
program
  .command('help')
  .description('Display help information')
  .argument('[command]', 'Command to get help for')
  .action((command) => {
    if (!command) {
      CLIUtils.showBanner();
      
      // Display quick start in a fancy panel
      CLIUtils.infoPanel('Quick Start Guide', [
        { label: '1. Setup', value: 'bvc config --setup' },
        { label: '2. Create repo', value: 'bvc init my-project' },
        { label: '3. Add files', value: 'bvc add .' },
        { label: '4. Commit', value: 'bvc commit -m "Initial commit"' },
        { label: '5. Push', value: 'bvc push' }
      ], { icon: CLIUtils.icons.rocket });
      
      console.log(CLIUtils.colors.gradient.rainbow('📖 Available Commands'));
      console.log(CLIUtils.colors.dim('═'.repeat(50)));
      program.help();
      
      // Pro tips in a stylish box
      const proTips = [
        'Use --help with any command for detailed help',
        'Use --verbose for detailed output',
        'Use --yes to skip confirmations',
        'Use bvc st as alias for status',
        'Use bvc setup for guided onboarding'
      ];
      
      CLIUtils.infoPanel('Pro Tips', proTips, { icon: CLIUtils.icons.sparkle });
    } else {
      const cmd = program.commands.find(c => c.name() === command);
      if (cmd) {
        cmd.help();
      } else {
        CLIUtils.error(`Unknown command: ${command}`);
        console.log('\nAvailable commands:');
        program.commands.forEach(c => {
          if (c.name() !== 'help') {
            console.log(CLIUtils.colors.primary(`  ${c.name()}`));
          }
        });
      }
    }
  });

// Enhanced error handling for unknown commands
program.on('command:*', () => {
  const unknownCommand = program.args[0];
  CLIUtils.error(`Unknown command: ${unknownCommand}`);
  
  // Find similar commands
  const availableCommands = program.commands
    .filter(c => c.name() !== 'help')
    .map(c => c.name());
  
  const suggestions = availableCommands.filter(cmd => {
    const distance = CLIUtils.levenshteinDistance(unknownCommand, cmd);
    return distance <= 2 && distance < cmd.length / 2;
  });
  
  if (suggestions.length > 0) {
    console.log(CLIUtils.colors.bold('\n💡 Did you mean:'));
    suggestions.forEach(suggestion => {
      console.log(CLIUtils.colors.primary(`  • bvc ${suggestion}`));
    });
  }
  
  console.log(CLIUtils.colors.muted('\nRun "bvc help" to see all available commands'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  CLIUtils.showBanner();
  program.help();
}

program.parse();
