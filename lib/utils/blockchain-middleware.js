const InitializationChecker = require('./initialization-checker');
const CLIUtils = require('./cli');

/**
 * Middleware-style function to check blockchain configuration before executing blockchain commands
 */
async function requireBlockchainConfig(options = {}) {
  // Skip check if explicitly local-only
  if (options.localOnly) {
    return true;
  }

  const checker = new InitializationChecker();
  const result = await checker.checkConfiguration();
  
  if (!result.isValid) {
    console.error(InitializationChecker.formatIssues(result.issues));
    
    // Provide helpful guidance based on the command context
    if (options.commandName) {
      console.log(`\n💡 After configuration, try: bvc ${options.commandName} again`);
    }
    
    return false;
  }
  
  return true;
}

/**
 * Check if blockchain connection works (more comprehensive check)
 */
async function verifyBlockchainConnection(options = {}) {
  if (options.localOnly) {
    return true;
  }

  const checker = new InitializationChecker();
  
  // First check configuration
  const configResult = await checker.checkConfiguration();
  if (!configResult.isValid) {
    console.error(InitializationChecker.formatIssues(configResult.issues));
    return false;
  }

  // Then check actual blockchain connection
  const connectionResult = await checker.validateBlockchainConnection();
  if (!connectionResult.isValid) {
    console.error('\n⚠️ Blockchain Connection Issues:');
    console.error('─'.repeat(50));
    connectionResult.issues.forEach((issue, index) => {
      console.error(`${index + 1}. ${issue.message}`);
      console.error(`   💡 Solution: ${issue.solution}\n`);
    });
    return false;
  }

  return true;
}

/**
 * Show helpful message for users who might want to use blockchain features
 */
function suggestBlockchainSetup(commandName) {
  console.log(CLIUtils.colors.muted('\n💡 Want to use blockchain features?'));
  console.log(CLIUtils.colors.muted('Set up in 2 minutes:'));
  console.log(CLIUtils.colors.muted('1. bvc config --setup'));
  console.log(CLIUtils.colors.muted('2. Get test ETH: https://sepoliafaucet.com'));
  console.log(CLIUtils.colors.muted(`3. bvc ${commandName} (without --local-only)`));
}

module.exports = {
  requireBlockchainConfig,
  verifyBlockchainConnection,
  suggestBlockchainSetup
};
