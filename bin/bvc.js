#!/usr/bin/env node

const { Command } = require('commander');
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

const program = new Command();

// Global error handler
process.on('uncaughtException', (error) => {
  CLIUtils.handleError(error, 'Uncaught Exception');
});

process.on('unhandledRejection', (error) => {
  CLIUtils.handleError(error, 'Unhandled Promise Rejection');
});

program
  .name('bvc')
  .description(CLIUtils.colors.primary('🔗 Blockchain Version Control - Decentralized Git powered by blockchain and IPFS'))
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--debug', 'Enable debug mode')
  .hook('preAction', (thisCommand, actionCommand) => {
    // Set debug mode if requested
    if (program.opts().debug) {
      process.env.DEBUG = 'true';
    }
    
    // Show banner for main commands (not for help)
    if (actionCommand.name() !== 'help' && !actionCommand.parent) {
      CLIUtils.showBanner();
    }
  });

// Register commands with enhanced descriptions
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

// Custom help command
program
  .command('help')
  .description('Display help information')
  .argument('[command]', 'Command to get help for')
  .action((command) => {
    if (!command) {
      CLIUtils.showBanner();
      program.help();
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
  CLIUtils.error(`Unknown command: ${program.args.join(' ')}`);
  CLIUtils.info('Run "bvc help" to see available commands');
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  CLIUtils.showBanner();
  program.help();
}

program.parse();
