const fs = require('fs-extra');
const path = require('path');
const { getNetworkConfig, getDefaultNetwork } = require('../config/networks');

class InitializationChecker {
  constructor() {
    this.configPath = null;
    this.userConfig = null;
    this.networkConfig = null;
  }

  async checkConfiguration() {
    const issues = [];
    
    try {
      // Check for user configuration file
      const configDir = path.join(process.cwd(), '.bvc');
      this.configPath = path.join(configDir, 'user-config.json');
      
      if (!(await fs.pathExists(this.configPath))) {
        issues.push({
          type: 'missing_config',
          message: 'BVC not configured',
          solution: 'Run: bvc config --setup'
        });
        return { isValid: false, issues };
      }

      // Load user configuration
      this.userConfig = await fs.readJson(this.configPath);

      // Check network configuration
      const networkName = this.userConfig.network || 'sepolia';
      try {
        this.networkConfig = getNetworkConfig(networkName);
      } catch (error) {
        issues.push({
          type: 'invalid_network',
          message: `Invalid network: ${networkName}`,
          solution: 'Run: bvc config --network sepolia'
        });
      }

      // Check private key
      if (!this.userConfig.privateKey) {
        issues.push({
          type: 'missing_private_key',
          message: 'Private key not configured',
          solution: 'Run: bvc config --private-key <your-key>'
        });
      }

      // Check author
      if (!this.userConfig.author) {
        issues.push({
          type: 'missing_author',
          message: 'Author name not set',
          solution: 'Run: bvc config --author "Your Name"'
        });
      }

      // Check RPC URL (if network doesn't have default or user override)
      const rpcUrl = this.userConfig.rpcUrl || (this.networkConfig ? this.networkConfig.rpcUrl : null);
      if (!rpcUrl || rpcUrl.includes('YOUR_')) {
        issues.push({
          type: 'invalid_rpc',
          message: 'RPC URL not properly configured',
          solution: `Get an RPC URL from Infura/Alchemy and run: bvc config --rpc-url <url>`
        });
      }

      // Check contract address availability
      const contractAddress = this.userConfig.contractAddress || 
                             (this.networkConfig ? this.networkConfig.contractAddress : null);
      
      if (!contractAddress) {
        if (networkName === 'localhost') {
          issues.push({
            type: 'missing_contract_local',
            message: 'Contract not deployed locally',
            solution: 'Run: npm run deploy-local'
          });
        } else {
          issues.push({
            type: 'missing_contract',
            message: `Contract address not configured for ${networkName}`,
            solution: 'Run: bvc config --contract-address <address>'
          });
        }
      }

    } catch (error) {
      issues.push({
        type: 'config_error',
        message: `Configuration error: ${error.message}`,
        solution: 'Run: bvc config --setup to reconfigure'
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      userConfig: this.userConfig,
      networkConfig: this.networkConfig
    };
  }

  async validateBlockchainConnection() {
    const { ethers } = require('ethers');
    const issues = [];

    try {
      if (!this.userConfig || !this.networkConfig) {
        await this.checkConfiguration();
      }

      const rpcUrl = this.userConfig.rpcUrl || this.networkConfig.rpcUrl;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test connection
      const network = await provider.getNetwork();
      
      // Verify network matches expectation
      if (network.chainId !== this.networkConfig.chainId) {
        issues.push({
          type: 'network_mismatch',
          message: `Connected to chain ID ${network.chainId}, expected ${this.networkConfig.chainId}`,
          solution: 'Check your RPC URL configuration'
        });
      }

      // Test wallet
      if (this.userConfig.privateKey) {
        const wallet = new ethers.Wallet(this.userConfig.privateKey, provider);
        const balance = await wallet.getBalance();
        
        if (balance.eq(0) && this.networkConfig.isTestnet) {
          issues.push({
            type: 'no_funds',
            message: 'Wallet has no test ETH',
            solution: `Get test ETH from: ${this.networkConfig.faucet || 'testnet faucet'}`
          });
        }
      }

    } catch (error) {
      issues.push({
        type: 'connection_error',
        message: `Cannot connect to blockchain: ${error.message}`,
        solution: 'Check your RPC URL and network connection'
      });
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  static formatIssues(issues) {
    if (issues.length === 0) return '';

    let output = '\n❌ Configuration Issues Found:\n';
    output += '─'.repeat(50) + '\n';

    issues.forEach((issue, index) => {
      output += `${index + 1}. ${issue.message}\n`;
      output += `   💡 Solution: ${issue.solution}\n\n`;
    });

    output += '🚀 Quick setup: bvc config --setup\n';
    output += '📚 Help: bvc --help\n';

    return output;
  }

  static async checkAndShowIssues() {
    const checker = new InitializationChecker();
    const result = await checker.checkConfiguration();
    
    if (!result.isValid) {
      console.error(InitializationChecker.formatIssues(result.issues));
      return false;
    }
    
    return true;
  }
}

module.exports = InitializationChecker;
