const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const CLIUtils = require('../utils/cli');

const add = new Command('add');

add
  .description('Stage files for commit')
  .argument('<files...>', 'Files to stage (supports glob patterns)')
  .option('--all', 'Stage all modified files')
  .option('--force', 'Force add files (ignore .bvcignore)')
  .addHelpText('after', `
Examples:
  $ bvc add file.txt              Stage a single file
  $ bvc add *.js                  Stage all JavaScript files
  $ bvc add src/                  Stage all files in src directory
  $ bvc add --all                 Stage all modified files
`)
  .action(async (files, options) => {
    try {
      const bvcPath = await CLIUtils.validateBVCRepo(fs, path);
      const stagingPath = path.join(bvcPath, 'staging.json');

      let staging = { files: [] };
      if (await fs.pathExists(stagingPath)) {
        staging = await fs.readJson(stagingPath);
      }

      const spinner = CLIUtils.spinner('Staging files...');
      spinner.start();

      let filesToAdd = files;
      
      // Handle --all option
      if (options.all) {
        // TODO: Implement finding all modified files
        filesToAdd = files.length > 0 ? files : ['.']; // Fallback for now
      }

      let addedFiles = 0;
      let skippedFiles = 0;

      for (const file of filesToAdd) {
        const filePath = path.resolve(file);
        const relativePath = path.relative(process.cwd(), filePath);
        
        spinner.text = `Processing ${relativePath}...`;

        if (!await fs.pathExists(filePath)) {
          CLIUtils.warning(`File not found: ${relativePath}`);
          skippedFiles++;
          continue;
        }

        // Check if it's a directory
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          // Handle directory - add all files in it
          const dirFiles = await fs.readdir(filePath);
          for (const dirFile of dirFiles) {
            const dirFilePath = path.join(filePath, dirFile);
            const dirStat = await fs.stat(dirFilePath);
            
            if (dirStat.isFile() && !dirFile.startsWith('.')) {
              await addSingleFile(dirFilePath, staging);
              addedFiles++;
            }
          }
        } else {
          await addSingleFile(filePath, staging);
          addedFiles++;
        }
      }

      await fs.writeJson(stagingPath, staging, { spaces: 2 });

      spinner.succeed(`Staging complete: ${addedFiles} file${addedFiles !== 1 ? 's' : ''} staged`);

      if (skippedFiles > 0) {
        CLIUtils.warning(`${skippedFiles} file${skippedFiles !== 1 ? 's' : ''} skipped`);
      }

      // Show what was staged
      if (addedFiles > 0) {
        console.log(CLIUtils.colors.success(`\n${CLIUtils.icons.success} Files staged for commit:`));
        const recentFiles = staging.files.slice(-addedFiles);
        recentFiles.forEach(file => {
          const size = file.size ? ` (${Math.round(file.size / 1024)} KB)` : '';
          console.log(CLIUtils.colors.muted(`  • ${file.path}${size}`));
        });

        CLIUtils.info('Next step: bvc commit -m "Your commit message"');
      }

    } catch (error) {
      CLIUtils.handleError(error, 'File staging');
    }
  });

async function addSingleFile(filePath, staging) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check if file is already staged
  const existingIndex = staging.files.findIndex(f => f.path === relativePath);
  
  // Read file and calculate hash
  const content = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const stat = await fs.stat(filePath);
  
  const fileInfo = {
    path: relativePath,
    hash: hash,
    size: stat.size,
    modified: stat.mtime.toISOString(),
    addedAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    // Update existing entry
    staging.files[existingIndex] = fileInfo;
  } else {
    // Add new entry
    staging.files.push(fileInfo);
  }
}

module.exports = add;
