const chalk = require('chalk').default || require('chalk');
const ora = require('ora').default || require('ora');
const boxen = require('boxen').default || require('boxen');
const figlet = require('figlet');
const Table = require('cli-table3');
const inquirer = require('inquirer').default || require('inquirer');
const gradient = require('gradient-string').default || require('gradient-string');
const cliProgress = require('cli-progress');

// Handle chalk v5+ vs v4- compatibility
const chalkInstance = chalk;
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
    boldError: (text) => chalkInstance.bold.red(text),
    // New gradient colors
    gradient: {
      rainbow: (text) => gradient('cyan', 'magenta')(text),
      ocean: (text) => gradient('blue', 'cyan')(text),
      fire: (text) => gradient('red', 'yellow')(text),
      nature: (text) => gradient('green', 'lime')(text),
      sunset: (text) => gradient('orange', 'pink')(text)
    },
    // Status colors
    status: {
      pending: chalkInstance.yellow,
      running: chalkInstance.blue,
      completed: chalkInstance.green,
      failed: chalkInstance.red
    }
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
    checkpoint: '🏁',
    stats: '📊',
    revert: '↩️',
    undo: '↩️',
    message: '💬',
    time: '⏰',
    // New UI icons
    sparkle: '✨',
    fire: '🔥',
    zap: '⚡',
    star: '⭐',
    gem: '💎',
    trophy: '🏆',
    target: '🎯',
    heart: '❤️',
    thumbsUp: '👍',
    party: '🎉',
    tool: '🔧',
    shield: '🛡️',
    key: '🔑',
    clock: '⏰',
    calendar: '📅',
    chart: '📊',
    box: '📦',
    link: '🔗',
    eye: '👁️',
    pencil: '✏️',
    camera: '📸',
    bell: '🔔'
  };

  /**
   * Display a banner with the app name
   */
  static showBanner() {
    try {
      const banner = figlet.textSync('BVC', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      });
      
      console.log(CLIUtils.colors.gradient.ocean(banner));
      console.log(CLIUtils.colors.gradient.rainbow('🚀 Blockchain Version Control - Decentralized Git'));
      console.log(CLIUtils.colors.muted('   Powered by blockchain and IPFS'));
      console.log(CLIUtils.colors.dim('   ─'.repeat(50)));
      console.log();
    } catch (error) {
      // Fallback if figlet fails
      console.log(CLIUtils.colors.gradient.ocean('🔗 🚀 BVC - Blockchain Version Control'));
      console.log(CLIUtils.colors.gradient.rainbow('Decentralized Git powered by blockchain and IPFS'));
      console.log(CLIUtils.colors.dim('─'.repeat(50)));
      console.log();
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
   * Display a celebration message for major achievements
   */
  static celebrate(message, details = null) {
    const celebrationBox = boxenInstance(`${CLIUtils.icons.party} ${message}`, {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'double',
      backgroundColor: 'black'
    });
    console.log(celebrationBox);
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
    return ora({
      text,
      spinner: {
        interval: 120,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      },
      color: 'cyan'
    });
  }

  /**
   * Create a progress bar for operations with known progress
   */
  static createProgressBar(title, total) {
    return new cliProgress.SingleBar({
      format: `${CLIUtils.colors.primary(title)} ${CLIUtils.colors.muted('[')}${CLIUtils.colors.gradient.ocean('{bar}')}${CLIUtils.colors.muted(']')} ${CLIUtils.colors.bold('{percentage}%')} | {value}/{total} | ETA: {eta}s`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
  }

  /**
   * Show progress for multi-step operations
   */
  static async showProgress(steps, title = 'Progress') {
    console.log(CLIUtils.colors.boldPrimary(`\n${CLIUtils.icons.loading} ${title}`));
    console.log('─'.repeat(40));
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const spinner = CLIUtils.spinner(step.text).start();
      
      try {
        await step.action();
        spinner.succeed(CLIUtils.colors.success(step.success || 'Done'));
      } catch (error) {
        spinner.fail(CLIUtils.colors.error(step.error || 'Failed'));
        throw error;
      }
    }
    
    console.log();
  }

  /**
   * Prompt user for confirmation
   */
  static async confirm(message, defaultValue = false) {
    if (process.env.BVC_NON_INTERACTIVE === 'true') {
      return true;
    }
    
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: message,
        default: defaultValue
      }
    ]);
    return confirmed;
  }

  /**
   * Prompt user to select from a list
   */
  static async select(message, choices, defaultValue = null) {
    if (process.env.BVC_NON_INTERACTIVE === 'true') {
      return defaultValue || choices[0]?.value;
    }
    
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: message,
        choices: choices
      }
    ]);
    return selected;
  }

  /**
   * Prompt user for input
   */
  static async input(message, defaultValue = '') {
    if (process.env.BVC_NON_INTERACTIVE === 'true') {
      return defaultValue;
    }
    
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: message,
        default: defaultValue
      }
    ]);
    return input;
  }

  /**
   * Display a boxed message
   */
  static box(message, options = {}) {
    const defaultOptions = {
      padding: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
      backgroundColor: 'black',
      ...options
    };
    
    console.log(boxenInstance(message, defaultOptions));
  }

  /**
   * Display a fancy information panel
   */
  static infoPanel(title, items, options = {}) {
    const { color = 'cyan', icon = CLIUtils.icons.info } = options;
    
    console.log(CLIUtils.colors.gradient.ocean(`\n${icon} ${title}`));
    console.log(CLIUtils.colors.dim('─'.repeat(title.length + 3)));
    
    items.forEach(item => {
      if (typeof item === 'string') {
        console.log(CLIUtils.colors.muted(`  • ${item}`));
      } else {
        console.log(CLIUtils.colors.bold(`  ${item.label}: `) + CLIUtils.colors.muted(item.value));
      }
    });
    console.log();
  }

  /**
   * Create a table for displaying data
   */
  static table(headers, options = {}) {
    // Handle both array and object formats
    if (Array.isArray(headers)) {
      return new Table({
        head: headers.map(h => CLIUtils.colors.gradient.ocean(h)),
        style: {
          head: [],
          border: ['cyan'],
          'padding-left': 1,
          'padding-right': 1
        },
        chars: {
          'top': '═',
          'top-mid': '╤',
          'top-left': '╔',
          'top-right': '╗',
          'bottom': '═',
          'bottom-mid': '╧',
          'bottom-left': '╚',
          'bottom-right': '╝',
          'left': '║',
          'left-mid': '╟',
          'mid': '─',
          'mid-mid': '┼',
          'right': '║',
          'right-mid': '╢',
          'middle': '│'
        },
        ...options
      });
    } else {
      // Object format with head property
      return new Table({
        head: headers.head.map(h => CLIUtils.colors.gradient.ocean(h)),
        style: {
          head: [],
          border: ['cyan'],
          'padding-left': 1,
          'padding-right': 1
        },
        chars: {
          'top': '═',
          'top-mid': '╤',
          'top-left': '╔',
          'top-right': '╗',
          'bottom': '═',
          'bottom-mid': '╧',
          'bottom-left': '╚',
          'bottom-right': '╝',
          'left': '║',
          'left-mid': '╟',
          'mid': '─',
          'mid-mid': '┼',
          'right': '║',
          'right-mid': '╢',
          'middle': '│'
        },
        ...headers
      });
    }
  }

  /**
   * Display repository status in a formatted way
   */
  static displayStatus(stagingData, repoInfo = null) {
    console.log(CLIUtils.colors.gradient.ocean('\n📊 Repository Status'));
    console.log(CLIUtils.colors.dim('═'.repeat(60)));

    if (repoInfo) {
      CLIUtils.infoPanel('Repository Information', [
        { label: 'Name', value: repoInfo.name || 'Unnamed' },
        { label: 'Branch', value: repoInfo.branch || 'main' },
        { label: 'Blockchain ID', value: repoInfo.repoId ? `${repoInfo.repoId.slice(0, 20)}...` : 'Local only' }
      ], { icon: CLIUtils.icons.folder });
    }

    if (stagingData.files && stagingData.files.length > 0) {
      console.log(CLIUtils.colors.gradient.nature(`${CLIUtils.icons.file} Staged Files (${stagingData.files.length})`));
      console.log(CLIUtils.colors.dim('─'.repeat(30)));
      
      const fileTable = CLIUtils.table(['File', 'Status', 'Size']);
      stagingData.files.forEach(file => {
        const size = file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown';
        const status = CLIUtils.colors.success('Ready');
        fileTable.push([
          CLIUtils.colors.primary(file.path),
          status,
          CLIUtils.colors.muted(size)
        ]);
      });
      
      console.log(fileTable.toString());
    } else {
      CLIUtils.infoPanel('Staging Area', [
        'No files staged for commit',
        'Use "bvc add <files>" to stage files'
      ], { icon: CLIUtils.icons.info, color: 'yellow' });
    }

    console.log();
  }

  /**
   * Display commit log in a formatted way
   */
  static displayLog(commits) {
    if (!commits || commits.length === 0) {
      CLIUtils.infoPanel('Commit History', [
        'No commits found',
        'Create your first commit with "bvc commit -m \'message\'"'
      ], { icon: CLIUtils.icons.commit, color: 'yellow' });
      return;
    }

    console.log(CLIUtils.colors.gradient.fire('\n📜 Commit History'));
    console.log(CLIUtils.colors.dim('═'.repeat(70)));

    commits.forEach((commit, index) => {
      const isLatest = index === 0;
      const prefix = isLatest ? CLIUtils.icons.star : CLIUtils.icons.commit;
      const statusColor = isLatest ? CLIUtils.colors.gradient.fire : CLIUtils.colors.primary;
      
      console.log();
      console.log(statusColor(`${prefix} ${commit.hash ? commit.hash.slice(0, 8) : 'unknown'}`) + 
        (isLatest ? CLIUtils.colors.success(' (latest)') : ''));
      
      const commitBox = boxenInstance(
        `${CLIUtils.colors.bold(commit.message || 'No message')}\n\n` +
        `${CLIUtils.colors.muted('Author:')} ${commit.author || 'Unknown'}\n` +
        `${CLIUtils.colors.muted('Date:')} ${commit.timestamp ? new Date(commit.timestamp).toLocaleString() : 'Unknown'}`,
        {
          padding: { top: 0, bottom: 0, left: 1, right: 1 },
          borderColor: isLatest ? 'yellow' : 'cyan',
          borderStyle: 'round',
          backgroundColor: 'black'
        }
      );
      
      console.log(commitBox);
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
    // Check in user's original directory first
    const userCwd = process.env.USER_PWD || process.env.PWD || process.cwd();
    let bvcPath = path.join(userCwd, '.bvc');
    
    if (await fs.pathExists(bvcPath)) {
      return bvcPath;
    }
    
    // Fallback to current working directory
    bvcPath = path.join(process.cwd(), '.bvc');
    
    if (!await fs.pathExists(bvcPath)) {
      CLIUtils.error('Not a BVC repository', 'Run "bvc init <name>" to create a new repository');
      process.exit(1);
    }
    
    return bvcPath;
  }

  /**
   * Handle errors consistently
   */
  static handleError(error, context = '', suggestions = []) {
    console.log();
    CLIUtils.error(`Operation failed${context ? ` (${context})` : ''}`, error.message);
    
    if (suggestions.length > 0) {
      console.log(CLIUtils.colors.bold('\n💡 Suggestions:'));
      suggestions.forEach((suggestion, index) => {
        console.log(CLIUtils.colors.muted(`  ${index + 1}. ${suggestion}`));
      });
    }
    
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
    CLIUtils.celebrate(message);
    
    if (nextSteps.length > 0) {
      CLIUtils.infoPanel('Next Steps', nextSteps.map((step, index) => 
        `${CLIUtils.colors.primary(`${index + 1}.`)} ${step}`
      ), { icon: CLIUtils.icons.target });
    }
    console.log();
  }

  /**
   * Calculate Levenshtein distance for string similarity
   */
  static levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Compare version strings
   */
  static compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }
}

module.exports = CLIUtils;
