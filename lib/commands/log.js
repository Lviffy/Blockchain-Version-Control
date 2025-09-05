const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');

const log = new Command('log');

log
  .description('View commit history')
  .action(async () => {
    const bvcPath = path.join(process.cwd(), '.bvc');
    const commitsPath = path.join(bvcPath, 'commits.json');

    try {
      if (!await fs.pathExists(bvcPath)) {
        console.error('Not a BVC repository. Run "bvc init" first.');
        process.exit(1);
      }

      const commits = await fs.readJson(commitsPath);

      if (commits.length === 0) {
        console.log('No commits yet.');
        return;
      }

      commits.reverse().forEach(commit => {
        console.log(`commit ${commit.commitHash}`);
        console.log(`Author: ${commit.author}`);
        console.log(`Date: ${commit.timestamp}`);
        console.log(`\n    ${commit.message}\n`);
      });

    } catch (error) {
      console.error('Error viewing log:', error.message);
      process.exit(1);
    }
  });

module.exports = log;
