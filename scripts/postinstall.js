#!/usr/bin/env node

/**
 * Post-install setup script for BVC package
 * This runs after npm install to help users get started
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function postInstallSetup() {
  try {
    console.log('📦 BVC Post-Install Setup');
    console.log('========================');
    
    // Check if this is a global install
    const isGlobal = __dirname.includes('npm/lib/node_modules') || __dirname.includes('npm-global');
    
    if (isGlobal) {
      console.log('✅ BVC installed globally');
      console.log('\n🚀 Getting Started:');
      console.log('1. Run: bvc config --setup');
      console.log('2. Create your first repo: bvc init my-project');
      console.log('3. Add files: bvc add .');
      console.log('4. Commit: bvc commit -m "Initial commit"');
      console.log('\n📚 For more help: bvc --help');
    } else {
      console.log('📁 BVC installed locally');
      console.log('\n🚀 Getting Started:');
      console.log('1. Run: npx bvc config --setup');
      console.log('2. Create your first repo: npx bvc init my-project');
      console.log('3. Add files: npx bvc add .');
      console.log('4. Commit: npx bvc commit -m "Initial commit"');
      console.log('\n📚 For more help: npx bvc --help');
    }
    
    console.log('\n🌐 Networks Available:');
    console.log('• Sepolia Testnet (default) - Free testnet with faucet');
    console.log('• Local Hardhat - For development');
    console.log('• Ethereum Mainnet - Production (requires real ETH)');
    
    console.log('\n🔗 Useful Links:');
    console.log('• Documentation: https://github.com/Lviffy/BVC#readme');
    console.log('• Sepolia Faucet: https://sepoliafaucet.com');
    console.log('• Report Issues: https://github.com/Lviffy/BVC/issues');
    
  } catch (error) {
    console.error('Setup warning:', error.message);
  }
}

// Only run if this script is executed directly (not imported)
if (require.main === module) {
  postInstallSetup();
}

module.exports = postInstallSetup;
