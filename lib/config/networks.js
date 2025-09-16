// Default network configurations and deployed contract addresses
const NETWORKS = {
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    blockExplorer: 'https://sepolia.etherscan.io',
    contractAddress: '0xA8A77a933Db23eFBC39d7D3D246649BE7070Eb59',
    faucet: 'https://sepoliafaucet.com',
    isTestnet: true,
    gasLimit: 8000000,
    gasPrice: 20000000000, // 20 gwei
    confirmations: 2
  },
  localhost: {
    name: 'Local Hardhat',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: null,
    contractAddress: null, // Will be set from local deployment
    faucet: null,
    isTestnet: true,
    gasLimit: 8000000,
    gasPrice: 8000000000, // 8 gwei
    confirmations: 1
  },
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    blockExplorer: 'https://etherscan.io',
    contractAddress: null, // To be deployed
    faucet: null,
    isTestnet: false,
    gasLimit: 8000000,
    gasPrice: 30000000000, // 30 gwei
    confirmations: 3
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    contractAddress: null,
    faucet: null,
    isTestnet: false,
    gasLimit: 8000000,
    gasPrice: 30000000000,
    confirmations: 3
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    contractAddress: null,
    faucet: null,
    isTestnet: false,
    gasLimit: 8000000,
    gasPrice: 1000000000, // 1 gwei
    confirmations: 1
  }
};

const DEFAULT_NETWORK = 'sepolia';

function getNetworkConfig(networkName = DEFAULT_NETWORK) {
  const network = NETWORKS[networkName];
  if (!network) {
    throw new Error(`Unknown network: ${networkName}. Available networks: ${Object.keys(NETWORKS).join(', ')}`);
  }
  return network;
}

function getAllNetworks() {
  return NETWORKS;
}

function getDefaultNetwork() {
  return getNetworkConfig(DEFAULT_NETWORK);
}

function isValidNetwork(networkName) {
  return networkName in NETWORKS;
}

module.exports = {
  NETWORKS,
  DEFAULT_NETWORK,
  getNetworkConfig,
  getAllNetworks,
  getDefaultNetwork,
  isValidNetwork
};
