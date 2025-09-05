const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const add = new Command('add');

add
  .description('Stage files for commit')
  .argument('<files...>', 'Files to stage')
  .action(async (files) => {
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

      for (const file of files) {
        const filePath = path.resolve(file);
        if (!await fs.pathExists(filePath)) {
          console.error(`File not found: ${file}`);
          continue;
        }

        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          console.error(`Cannot add directory: ${file}`);
          continue;
        }

        const content = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');

        const stagedFile = {
          path: path.relative(process.cwd(), filePath),
          hash: hash,
          size: stat.size,
          modified: stat.mtime.toISOString()
        };

        // Remove existing entry if present
        staging.files = staging.files.filter(f => f.path !== stagedFile.path);
        staging.files.push(stagedFile);

        console.log(`Staged: ${stagedFile.path}`);
      }

      await fs.writeJson(stagingPath, staging, { spaces: 2 });

    } catch (error) {
      console.error('Error staging files:', error.message);
      process.exit(1);
    }
  });

module.exports = add;
