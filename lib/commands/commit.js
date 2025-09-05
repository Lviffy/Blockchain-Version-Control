const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const commit = new Command('commit');

commit
  .description('Create a new commit')
  .option('-m, --message <message>', 'Commit message')
  .action(async (options) => {
    const bvcPath = path.join(process.cwd(), '.bvc');
    const stagingPath = path.join(bvcPath, 'staging.json');
    const commitsPath = path.join(bvcPath, 'commits.json');
    const configPath = path.join(bvcPath, 'config.json');

    try {
      if (!await fs.pathExists(bvcPath)) {
        console.error('Not a BVC repository. Run "bvc init" first.');
        process.exit(1);
      }

      const staging = await fs.readJson(stagingPath);
      if (staging.files.length === 0) {
        console.error('Nothing to commit. Stage files first with "bvc add".');
        process.exit(1);
      }

      const config = await fs.readJson(configPath);
      const commits = await fs.readJson(commitsPath);

      // Calculate commit hash from staged files
      const fileHashes = staging.files.map(f => f.hash).sort();
      const commitHash = crypto.createHash('sha256')
        .update(fileHashes.join(''))
        .digest('hex');

      // Get last commit hash
      const parentHash = commits.length > 0 ? commits[commits.length - 1].commitHash : null;

      // Create commit object
      const newCommit = {
        repoId: config.repoId,
        commitHash: commitHash,
        parentHash: parentHash,
        author: config.author || 'unknown',
        message: options.message || '',
        timestamp: new Date().toISOString(),
        ipfsCid: '', // TODO: Upload to IPFS
        files: staging.files
      };

      // Add to commits
      commits.push(newCommit);
      await fs.writeJson(commitsPath, commits, { spaces: 2 });

      // Clear staging
      await fs.writeJson(stagingPath, { files: [] }, { spaces: 2 });

      console.log(`Committed ${staging.files.length} files`);
      console.log(`Commit hash: ${commitHash}`);
      console.log('Note: On-chain recording and IPFS upload not implemented yet.');

    } catch (error) {
      console.error('Error creating commit:', error.message);
      process.exit(1);
    }
  });

module.exports = commit;
