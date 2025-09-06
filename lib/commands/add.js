const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const CLIUtils = require('../utils/cli');

const add = new Command('add');

add
  .description('Stage files for commit')
  .argument('[files...]', 'Files to stage (supports glob patterns)')
  .option('--all', 'Stage all modified files')
  .option('--force', 'Force add files (ignore .bvcignore)')
  .addHelpText('after', `
Examples:
  $ bvc add file.txt              Stage a single file
  $ bvc add .                     Stage all files in current directory
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

      let filesToAdd = files || [];
      
      // Handle special cases
      if (options.all) {
        filesToAdd = await findModifiedFiles(process.env.USER_PWD || process.env.PWD || process.cwd(), bvcPath);
        if (filesToAdd.length === 0) {
          spinner.succeed('No modified files found');
          return;
        }
      } else if (filesToAdd.includes('.')) {
        // Handle 'add .' - add all files in current directory and subdirectories
        const userCwd = process.env.USER_PWD || process.env.PWD || process.cwd();
        filesToAdd = await getAllFilesInDirectory(userCwd);
        if (filesToAdd.length === 0) {
          spinner.succeed('No files found to add');
          return;
        }
      } else if (filesToAdd.length === 0) {
        CLIUtils.error('No files specified. Use "bvc add ." to stage all files or "bvc add --all" to stage modified files.');
        spinner.stop();
        return;
      }

      let addedFiles = 0;
      let skippedFiles = 0;

      for (const file of filesToAdd) {
        // Use the user's original working directory
        const userCwd = process.env.USER_PWD || process.env.PWD || process.cwd();
        const filePath = path.isAbsolute(file) ? file : path.resolve(userCwd, file);
        const relativePath = path.relative(userCwd, filePath);
        
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

async function findModifiedFiles(userCwd, bvcPath) {
  const modifiedFiles = [];
  const commitsPath = path.join(bvcPath, 'commits.json');
  
  // Get last commit files for comparison
  let lastCommitFiles = new Map();
  try {
    if (await fs.pathExists(commitsPath)) {
      const commits = await fs.readJson(commitsPath);
      if (commits.length > 0) {
        const lastCommit = commits[commits.length - 1];
        lastCommit.files.forEach(file => {
          lastCommitFiles.set(file.path, file.hash);
        });
      }
    }
  } catch (error) {
    // Could not read commits, continue
  }
  
  // Get all files in the repository
  const allFiles = await getAllFiles(userCwd);
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(userCwd, filePath);
    
    // Skip .bvc directory and hidden files
    if (relativePath.startsWith('.bvc') || path.basename(filePath).startsWith('.')) {
      continue;
    }
    
    try {
      // Calculate current hash
      const content = await fs.readFile(filePath);
      const currentHash = crypto.createHash('sha256').update(content).digest('hex');
      
      // Check if file is new or modified
      const lastHash = lastCommitFiles.get(relativePath);
      if (!lastHash || lastHash !== currentHash) {
        modifiedFiles.push(filePath);
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return modifiedFiles;
}

async function getAllFilesInDirectory(dirPath) {
  const files = [];
  const excludeDirs = ['.bvc', 'node_modules', '.git', 'artifacts', 'cache'];
  
  async function scanDir(currentPath) {
    const items = await fs.readdir(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!excludeDirs.includes(item)) {
          await scanDir(itemPath);
        }
      } else {
        // Skip hidden files
        if (!item.startsWith('.')) {
          files.push(itemPath);
        }
      }
    }
  }
  
  await scanDir(dirPath);
  return files;
}

async function addSingleFile(filePath, staging) {
  // Use the user's original working directory for relative path calculation
  const userCwd = process.env.USER_PWD || process.env.PWD || process.cwd();
  const relativePath = path.relative(userCwd, filePath);
  
  // Check if file is already staged
  const existingIndex = staging.files.findIndex(f => f.path === relativePath);
  
  // Read file and calculate hash
  const content = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const stat = await fs.stat(filePath);
  
  // Try to get previous version for diff calculation
  let previousContent = null;
  const bvcPath = path.join(userCwd, '.bvc');
  const commitsPath = path.join(bvcPath, 'commits.json');
  
  try {
    if (await fs.pathExists(commitsPath)) {
      const commits = await fs.readJson(commitsPath);
      // Look for the most recent version of this file
      for (let i = commits.length - 1; i >= 0; i--) {
        const commit = commits[i];
        const fileInCommit = commit.files.find(f => f.path === relativePath);
        if (fileInCommit && fileInCommit.content) {
          // Decode the content from the commit
          try {
            previousContent = Buffer.from(fileInCommit.content, 'base64');
          } catch (error) {
            // Could not decode content
          }
          break; // Found the most recent version
        }
      }
    }
  } catch (error) {
    // Could not get previous version, continue without it
  }
  
  // For diff calculation, store the current content as previous content
  // This will be used in the next commit to calculate differences
  const fileInfo = {
    path: relativePath,
    hash: hash,
    size: stat.size,
    modified: stat.mtime.toISOString(),
    addedAt: new Date().toISOString(),
    currentContent: content.toString('base64'), // Store current content for next diff
    previousContent: previousContent ? previousContent.toString('base64') : null
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
