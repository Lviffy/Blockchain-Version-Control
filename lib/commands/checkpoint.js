const { Command } = require('commander');

const checkpoint = new Command('checkpoint');

checkpoint
  .description('Create a checkpoint (batch commits)')
  .argument('<branch>', 'Branch to checkpoint')
  .action(async (branch) => {
    console.log(`Checkpoint functionality not implemented yet.`);
    console.log(`Would create checkpoint for branch: ${branch}`);
  });

module.exports = checkpoint;
