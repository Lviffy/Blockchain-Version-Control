const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const figlet = require('figlet');
const Table = require('cli-table3');

// Handle chalk v5+ vs v4- compatibility
const chalkInstance = chalk.default || chalk;
// Handle ora ES modules compatibility
const oraInstance = ora.default || ora;
// Handle boxen ES modules compatibility  
const boxenInstance = boxen.default || boxen;

/**
 * CLI utility functions for consistent styling and user experience
 */
class CLIUtils {
  static colors = {
    primary: chalkInstance.cyan,
    success: chalkInstance.green,
    warning: chalkInstance.yellow,
    error: chalkInstance.red,
    info: chalkInstance.blue,
    muted: chalkInstance.gray,
    bold: chalkInstance.bold,
    dim: chalkInstance.dim,
    // Helper combinations
    boldPrimary: (text) => chalkInstance.bold.cyan(text),
    boldSuccess: (text) => chalkInstance.bold.green(text),
    boldWarning: (text) => chalkInstance.bold.yellow(text),
    boldError: (text) => chalkInstance.bold.red(text)
  };

  static icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    rocket: '🚀',
    folder: '📁',
    file: '📄',
    git: '🔗',
    blockchain: '⛓️',
    ipfs: '🌐',
    loading: '⏳',
    commit: '📝',
    hash: '#️⃣',
    user: '👤',
    download: '⬇️',
    upload: '⬆️',
    checkpoint: '🏁'
  };

  /**
   * Display a banner with the app name
   */
  static showBanner() {
    try {
      const banner = figlet.textSync('BVC', {
        font: 'Small',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      });
      
      console.log(CLIUtils.colors.primary(banner));
      console.log(CLIUtils.colors.muted('Blockchain Version Control - Decentralized Git\n'));
    } catch (error) {
      // Fallback if figlet fails
      console.log(CLIUtils.colors.boldPrimary('🔗 BVC - Blockchain Version Control'));
      console.log(CLIUtils.colors.muted('Decentralized Git powered by blockchain and IPFS\n'));
    }
  }

  /**
   * Display success message
   */
  static success(message, details = null) {
    console.log(CLIUtils.colors.success(`${CLIUtils.icons.success} ${message}`));
    if (details) {
      console.log(CLIUtils.colors.muted(`   ${details}`));
    }
  }

  /**
   * Display error message
   */
  static error(message, details = null) {
    console.log(CLIUtils.colors.error(`${CLIUtils.icons.error} ${message}`));
    if (details) {
      console.log(CLIUtils.colors.muted(`   ${details}`));
    }
  }

  /**
   * Display warning message
   */
  static warning(message, details = null) {
    console.log(CLIUtils.colors.warning(`${CLIUtils.icons.warning} ${message}`));
    if (details) {
      console.log(CLIUtils.colors.muted(`   ${details}`));
    }
  }

  /**
   * Display info message
   */
  static info(message, details = null) {
    console.log(CLIUtils.colors.info(`${CLIUtils.icons.info} ${message}`));
    if (details) {
      console.log(CLIUtils.colors.muted(`   ${details}`));
    }
  }

  /**
   * Create a spinner for long-running operations
   */
  static spinner(text) {
    return oraInstance({
      text,
      spinner: 'dots',
      color: 'cyan'
    });
  }

  /**
   * Display a boxed message
   */
  static box(message, options = {}) {
    const defaultOptions = {
      padding: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
      ...options
    };
    
    console.log(boxenInstance(message, defaultOptions));
  }

  /**
   * Create a table for displaying data
   */
  static table(headers, options = {}) {
    return new Table({
      head: headers.map(h => CLIUtils.colors.bold(h)),
      style: {
        head: [],
        border: ['cyan']
      },
      ...options
    });
  }

  /**
   * Display repository status in a formatted way
   */
  static displayStatus(stagingData, repoInfo = null) {
    console.log(CLIUtils.colors.boldPrimary('\n📊 Repository Status'));
    console.log('─'.repeat(40));

    if (repoInfo) {
      console.log(CLIUtils.colors.muted(`Repository: ${repoInfo.name || 'Unnamed'}`));
      console.log(CLIUtils.colors.muted(`Branch: ${repoInfo.branch || 'main'}`));
      console.log();
    }

    if (stagingData.files && stagingData.files.length > 0) {
      console.log(CLIUtils.colors.success(`${CLIUtils.icons.file} Staged files (${stagingData.files.length}):`));
      stagingData.files.forEach(file => {
        console.log(CLIUtils.colors.muted(`   • ${file.path}`));
      });
    } else {
      console.log(CLIUtils.colors.muted(`${CLIUtils.icons.info} No files staged for commit`));
    }

    console.log();
  }

  /**
   * Display commit log in a formatted way
   */
  static displayLog(commits) {
    if (!commits || commits.length === 0) {
      console.log(CLIUtils.colors.muted(`${CLIUtils.icons.info} No commits found`));
      return;
    }

    console.log(CLIUtils.colors.boldPrimary('\n📜 Commit History'));
    console.log('─'.repeat(50));

    commits.forEach((commit, index) => {
      const isLatest = index === 0;
      const prefix = isLatest ? CLIUtils.icons.success : CLIUtils.icons.git;
      
      console.log(CLIUtils.colors.bold(`${prefix} ${commit.hash ? commit.hash.slice(0, 8) : 'unknown'}`));
      console.log(CLIUtils.colors.primary(`   ${commit.message || 'No message'}`));
      console.log(CLIUtils.colors.muted(`   Author: ${commit.author || 'Unknown'}`));
      console.log(CLIUtils.colors.muted(`   Date: ${commit.timestamp ? new Date(commit.timestamp).toLocaleString() : 'Unknown'}`));
      
      if (index < commits.length - 1) {
        console.log();
      }
    });

    console.log();
  }

  /**
   * Display help for commands with examples
   */
  static displayHelp(command, description, examples = []) {
    console.log(CLIUtils.colors.boldPrimary(`\n📖 ${command}`));
    console.log('─'.repeat(30));
    console.log(CLIUtils.colors.muted(description));
    
    if (examples.length > 0) {
      console.log(CLIUtils.colors.bold('\nExamples:'));
      examples.forEach(example => {
        console.log(CLIUtils.colors.primary(`  $ ${example.command}`));
        console.log(CLIUtils.colors.muted(`    ${example.description}`));
      });
    }
    console.log();
  }

  /**
   * Validate if we're in a BVC repository
   */
  static async validateBVCRepo(fs, path) {
    const bvcPath = path.join(process.cwd(), '.bvc');
    
    if (!await fs.pathExists(bvcPath)) {
      CLIUtils.error('Not a BVC repository', 'Run "bvc init <name>" to create a new repository');
      process.exit(1);
    }
    
    return bvcPath;
  }

  /**
   * Handle errors consistently
   */
  static handleError(error, context = '') {
    console.log();
    CLIUtils.error(`Operation failed${context ? ` (${context})` : ''}`, error.message);
    
    if (process.env.DEBUG) {
      console.log(CLIUtils.colors.dim('\nStack trace:'));
      console.log(CLIUtils.colors.dim(error.stack));
    }
    
    process.exit(1);
  }

  /**
   * Display operation completion
   */
  static complete(message, nextSteps = []) {
    console.log();
    CLIUtils.success(message);
    
    if (nextSteps.length > 0) {
      console.log(CLIUtils.colors.bold('\nNext steps:'));
      nextSteps.forEach((step, index) => {
        console.log(CLIUtils.colors.muted(`  ${index + 1}. ${step}`));
      });
    }
    console.log();
  }
}

module.exports = CLIUtils;
