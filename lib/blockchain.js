const { ethers } = require('ethers');
const fs = require('fs-extra');
const path = require('path');
const IPFSService = require('./ipfs');
const { getNetworkConfig, getDefaultNetwork } = require('./config/networks');
const { BVC_ABI } = require('./config/abi');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.ipfs = new IPFSService();
    this.networkConfig = null;
  }

  async initialize(configPath) {
    try {
      const userConfig = await fs.readJson(configPath);
      
      // Determine network configuration
      const networkName = userConfig.network || 'sepolia';
      this.networkConfig = getNetworkConfig(networkName);
      
      // Initialize provider
      const rpcUrl = userConfig.rpcUrl || this.networkConfig.rpcUrl;
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Verify network connection
      try {
        const network = await this.provider.getNetwork();
        if (network.chainId !== this.networkConfig.chainId) {
          console.warn(`Warning: Connected to chain ID ${network.chainId}, expected ${this.networkConfig.chainId} for ${this.networkConfig.name}`);
        }
      } catch (error) {
        console.warn('Could not verify network connection:', error.message);
      }
      
      // Initialize signer
      if (userConfig.privateKey) {
        this.signer = new ethers.Wallet(userConfig.privateKey, this.provider);
      } else {
        throw new Error('Private key not configured. Run "bvc config --private-key <key>"');
      }

      // Load contract - try multiple sources
      let contractAddress = null;
      let contractABI = null;

      // 1. Try user config override
      if (userConfig.contractAddress) {
        contractAddress = userConfig.contractAddress;
      }
      
      // 2. Try network default
      if (!contractAddress && this.networkConfig.contractAddress) {
        contractAddress = this.networkConfig.contractAddress;
      }
      
      // 3. Try local deployment file (for localhost)
      if (!contractAddress) {
        const contractAddressPath = path.join(__dirname, '..', 'contracts', 'contract-address.json');
        if (await fs.pathExists(contractAddressPath)) {
          const contractData = await fs.readJson(contractAddressPath);
          contractAddress = contractData.BVC;
        }
      }

      // Load ABI - try local artifacts first, then fallback to embedded ABI
      const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'BVC.sol', 'BVC.json');
      if (await fs.pathExists(abiPath)) {
        const artifactData = await fs.readJson(abiPath);
        contractABI = artifactData.abi;
      } else {
        // Use embedded ABI as fallback
        contractABI = BVC_ABI;
      }

      if (contractAddress && contractABI) {
        this.contract = new ethers.Contract(
          contractAddress,
          contractABI,
          this.signer
        );
        console.log(`✅ Connected to BVC contract at ${contractAddress} on ${this.networkConfig.name}`);
      } else {
        const setupInstructions = this.networkConfig.name === 'Local Hardhat' 
          ? 'Run "npm run deploy-local" to deploy locally'
          : `Contract not configured for ${this.networkConfig.name}. Set contract address with: bvc config --contract-address <address>`;
        throw new Error(`Contract not available. ${setupInstructions}`);
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

  async getRepository(repoId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.contract.getRepository(repoId);
  }

  async getAllRepositories() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    const repoIds = await this.contract.getAllRepoIds();
    const repos = [];
    
    for (const repoId of repoIds) {
      const repo = await this.contract.getRepository(repoId);
      repos.push({ id: repoId, ...repo });
    }
    
    return repos;
  }

  async downloadCommitFromIPFS(ipfsCid, outputDir) {
    try {
      return await this.ipfs.downloadCommitBundle(ipfsCid, outputDir);
    } catch (error) {
      console.warn('IPFS download failed:', error.message);
      return null;
    }
  }

  async syncLocalCommitsToBlockchain(repoId, localCommits) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const blockchainCommits = await this.getCommits(repoId);
    const blockchainHashes = new Set(blockchainCommits.map(c => c.commitHash));
    
    const unpushedCommits = localCommits.filter(commit => 
      !blockchainHashes.has(commit.commitHash)
    );

    return unpushedCommits;
  }
}

module.exports = BlockchainService;
