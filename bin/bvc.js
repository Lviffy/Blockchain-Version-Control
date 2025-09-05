#!/usr/bin/env node

const { Command } = require('commander');
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

const program = new Command();

program
  .name('bvc')
  .description('Blockchain Version Control CLI')
  .version('1.0.0');

// Register commands
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

program.parse();
