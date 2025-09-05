const { Command } = require('commander');

const push = new Command('push');

push
  .description('Push commits to blockchain')
  .action(async () => {
    console.log('Push functionality not implemented yet.');
    console.log('This will upload commits to IPFS and record on blockchain.');
  });

module.exports = push;
