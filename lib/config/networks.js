// Default network configurations and deployed contract addresses
const NETWORKS = {
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/83fef17e5d5047e6b28be819f948bbd2',
    blockExplorer: 'https://sepolia.etherscan.io',
    contractAddress: '0xA8A77a933Db23eFBC39d7D3D246649BE7070Eb59',
    faucet: 'https://sepoliafaucet.com',
    isTestnet: true
  },
  localhost: {
    name: 'Local Hardhat',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: null,
    contractAddress: null, // Will be set from local deployment
    faucet: null,
    isTestnet: true
  },
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    blockExplorer: 'https://etherscan.io',
    contractAddress: null, // To be deployed
    faucet: null,
    isTestnet: false
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
