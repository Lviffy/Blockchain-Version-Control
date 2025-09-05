const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');

const status = new Command('status');

status
  .description('Show repository status')
  .action(async () => {
    const bvcPath = path.join(process.cwd(), '.bvc');
    const stagingPath = path.join(bvcPath, 'staging.json');

    try {
      if (!await fs.pathExists(bvcPath)) {
        console.error('Not a BVC repository. Run "bvc init" first.');
        process.exit(1);
      }

      let staging = { files: [] };
      if (await fs.pathExists(stagingPath)) {
        staging = await fs.readJson(stagingPath);
      }

      console.log('Staged files:');
      if (staging.files.length === 0) {
        console.log('  (none)');
      } else {
        staging.files.forEach(file => {
          console.log(`  ${file.path}`);
        });
      }

      // TODO: Show untracked files
      console.log('\nUntracked files:');
      console.log('  (not implemented yet)');

    } catch (error) {
      console.error('Error getting status:', error.message);
      process.exit(1);
    }
  });

module.exports = status;
