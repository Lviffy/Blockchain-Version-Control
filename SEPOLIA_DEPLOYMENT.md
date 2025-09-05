# Sepolia Testnet Deployment Guide

## Prerequisites

### 1. **Get Test ETH**
- Visit [Sepolia Faucet](https://sepoliafaucet.com)
- Enter your wallet address
- Request test ETH (you'll need ~0.1 ETH for deployment)

### 2. **Get Infura Project ID**
- Sign up at [Infura.io](https://infura.io)
- Create a new project
- Copy the Project ID
- Update `.env`: `SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### 3. **Get Etherscan API Key** (for verification)
- Sign up at [Etherscan.io](https://etherscan.io)
- Go to [API Keys](https://etherscan.io/apis)
- Create a new API key
- Update `.env`: `ETHERSCAN_API_KEY=your_api_key_here`

### 4. **Configure Private Key**
- **⚠️ SECURITY WARNING**: Never use your main wallet!
- Create a new wallet for testing
- Export the private key
- Update `.env`: `PRIVATE_KEY=0x...your_private_key`

## Deployment Steps

### 1. **Install IPFS** (Optional but recommended)
```bash
# macOS
brew install ipfs

# Linux
wget https://dist.ipfs.tech/kubo/v0.22.0/kubo_v0.22.0_linux-amd64.tar.gz
tar -xzf kubo_v0.22.0_linux-amd64.tar.gz
sudo bash kubo/install.sh

# Initialize and start
ipfs init
ipfs daemon
```

### 2. **Deploy to Sepolia**
```bash
# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy

# Verify contract (optional)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 3. **Configure BVC CLI for Sepolia**
```bash
# Configure for Sepolia
bvc config --private-key <YOUR_PRIVATE_KEY> --rpc-url https://sepolia.infura.io/v3/<PROJECT_ID>

# Create a repository
bvc init my-sepolia-repo

# Add and commit files
bvc add file.js
bvc commit -m "First commit on Sepolia!"
```

## Network Information

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

## Gas Costs (Estimated)

- **Deploy Contract**: ~2,000,000 gas (~0.02 ETH)
- **Create Repository**: ~250,000 gas (~0.0025 ETH)
- **Commit**: ~100,000 gas (~0.001 ETH)

## Troubleshooting

### Common Issues:
1. **Insufficient funds**: Get more test ETH from faucet
2. **Nonce too low**: Clear transaction history or wait
3. **Gas estimation failed**: Increase gas limit
4. **IPFS not connected**: Start IPFS daemon

### Useful Commands:
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network sepolia

# Get contract info
npx hardhat run scripts/contract-info.js --network sepolia
```

## Production Considerations

Before mainnet deployment:
- [ ] Security audit of smart contracts
- [ ] Gas optimization
- [ ] Multi-signature wallet setup
- [ ] Upgrade mechanism (proxy contracts)
- [ ] Monitor and alerting system
