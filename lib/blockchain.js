const { ethers } = require('ethers');
const fs = require('fs-extra');
const path = require('path');
const IPFSService = require('./ipfs');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.ipfs = new IPFSService();
  }

  async initialize(configPath) {
    try {
      const userConfig = await fs.readJson(configPath);
      
      // Initialize provider
      const rpcUrl = userConfig.rpcUrl || 'http://127.0.0.1:8545';
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Initialize signer
      if (userConfig.privateKey) {
        this.signer = new ethers.Wallet(userConfig.privateKey, this.provider);
      } else {
        throw new Error('Private key not configured. Run "bvc config --private-key <key>"');
      }

      // Load contract
      const contractAddressPath = path.join(__dirname, '..', 'contracts', 'contract-address.json');
      const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'BVC.sol', 'BVC.json');
      
      if (await fs.pathExists(contractAddressPath) && await fs.pathExists(abiPath)) {
        const contractData = await fs.readJson(contractAddressPath);
        const artifactData = await fs.readJson(abiPath);
        
        this.contract = new ethers.Contract(
          contractData.BVC,
          artifactData.abi,
          this.signer
        );
      } else {
        console.warn('Contract not deployed locally. Run "npm run deploy-local" first.');
      }

      // Initialize IPFS (optional)
      const ipfsEndpoint = userConfig.ipfsEndpoint || 'http://127.0.0.1:5001';
      await this.ipfs.initialize(ipfsEndpoint);

      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error.message);
      return false;
    }
  }

  async createRepo(name) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    const tx = await this.contract.createRepo(name);
    const receipt = await tx.wait();
    
    // Get repo ID from event
    const event = receipt.events.find(e => e.event === 'RepositoryCreated');
    return event.args.repoId;
  }

  async commitToBlockchain(repoId, commitHash, ipfsCid, message) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    const tx = await this.contract.commit(repoId, commitHash, ipfsCid, message);
    return await tx.wait();
  }

  async uploadCommitToIPFS(files) {
    try {
      return await this.ipfs.createCommitBundle(files);
    } catch (error) {
      console.warn('IPFS upload failed:', error.message);
      return '';
    }
  }

  async getCommits(repoId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.contract.getCommits(repoId);
  }
}

module.exports = BlockchainService;
