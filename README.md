# 🔗 Blockchain Version Control (BVC)

A decentralized version control system inspired by Git, but powered by **blockchain** and **IPFS**. Features cost-optimized local commits with efficient blockchain checkpoints.

[![npm version](https://badge.fury.io/js/bvc-eth.svg)](https://badge.fury.io/js/bvc-eth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **📦 NPM Package Users**: After installing via npm, BVC works out-of-the-box with Sepolia testnet! Just run `bvc config --setup` to get started. No local blockchain deployment needed.

## ✨ Features

- 🚀 **Decentralized**: No central server required
- ⛓️ **Blockchain-powered**: Immutable commit history on Ethereum
- 🌐 **IPFS storage**: Decentralized file storage
- 💰 **Cost Optimized**: Local commits (free) + blockchain checkpoints (efficient)
- 🔐 **Cryptographically secure**: SHA256 file hashing
- 💻 **Git-like CLI**: Familiar commands and workflows
- 🌍 **Multi-network**: Supports Sepolia testnet, local dev, and mainnet
- ↩️ **Version Revert**: Revert to any previous commit state

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g bvc-eth
bvc config --setup  # Quick setup wizard
```

### Local Installation
```bash
npm install bvc-eth
npx bvc config --setup  # Quick setup wizard
```

### For Development
```bash
git clone https://github.com/Lviffy/BVC.git
cd BVC
npm install
npm link  # or use: node bin/bvc.js
```

## 🚀 Quick Start

### 1. Configure BVC
```bash
# Global installation
bvc config --setup

# Local installation  
npx bvc config --setup
```

**What you'll need:**
- Ethereum wallet private key (create a new one for testing!)
- Network choice (Sepolia testnet recommended for beginners)
- Test ETH from [Sepolia Faucet](https://sepoliafaucet.com) (free!)

### 2. Create a Repository
```bash
bvc init my-project
cd my-project
```

### 3. Add Files and Commit
```bash
bvc add README.md
bvc commit -m "Initial commit"
```

### 4. Push to Blockchain
```bash
bvc push
```

### 5. Version Control (Optional)
```bash
bvc log                          # View commit history
bvc revert <commit-hash>         # Revert to any previous version
```

## 💰 Cost Optimization

BVC is designed for **cost efficiency**:

### Local Commits (Free)
```bash
bvc add file.js
bvc commit -m "Add feature"  # No gas fees!
```

### Blockchain Checkpoints (Efficient)
```bash
bvc checkpoint --message "Batch multiple commits"  # Single transaction
```

**Benefits:**
- ✅ Unlimited local commits (0 gas fees)
- ✅ Batch commits into single blockchain transaction
- ✅ 50-90% gas savings vs individual commits
- ✅ Full Git-like workflow

## 📋 Complete Command Reference

### Repository Management

#### `bvc init [name]` - Create repository (blockchain required)
```bash
bvc init my-project              # Create blockchain repository
bvc init --local-only my-repo    # Create local repository only
bvc init --interactive           # Interactive setup
bvc init --upgrade-blockchain    # Upgrade local repo to blockchain
```

#### `bvc config` - Configuration management
```bash
bvc config --setup               # Interactive setup
bvc config --private-key <key>   # Set wallet private key
bvc config --rpc-url <url>       # Set blockchain RPC
bvc config --ipfs-endpoint <url> # Set IPFS endpoint
bvc config --show                # Show current config
```

#### `bvc clone <repo-id>` - Clone repository
```bash
bvc clone 12345abc...            # Clone by repository ID
```

#### `bvc status` - Show repository status
```bash
bvc status                       # Show staged/untracked files
```

### File Operations

#### `bvc add <files>` - Stage files
```bash
bvc add file.js                  # Add single file
bvc add .                        # Add all files
bvc add *.js                     # Add with glob patterns
```

#### `bvc commit -m "message"` - Create commit
```bash
bvc commit -m "Add feature"       # Local commit (free)
bvc commit --blockchain -m "msg"  # Direct blockchain commit
```

#### `bvc revert <commit-hash>` - Revert to specific commit
```bash
bvc revert 436b0deb               # Revert to specific commit
bvc revert abc123 --force         # Force revert (overwrite changes)
bvc revert def456 --no-backup     # Skip backup creation
```

### Synchronization

#### `bvc push` - Push commits to blockchain
```bash
bvc push                         # Push individual commits
```

#### `bvc checkpoint` - Batch commits efficiently
```bash
bvc checkpoint --message "Batch" # Batch multiple commits
bvc checkpoint --dry-run         # Preview cost savings
```

#### `bvc pull` - Pull latest changes
```bash
bvc pull                         # Fetch from blockchain/IPFS
```

#### `bvc log` - View commit history
```bash
bvc log                          # Show commit history
bvc log --checkpoints            # Show checkpoint history
```

### Advanced Features

#### `bvc list` - List repositories
```bash
bvc list                         # Show all repositories
```

## 🔧 Configuration

BVC requires blockchain and IPFS configuration:

### Required Settings
- **Private Key**: Your Ethereum wallet private key
- **RPC URL**: Blockchain network endpoint (Sepolia/Mainnet)
- **IPFS Endpoint**: IPFS node for file storage

### Setup Process
```bash
bvc config --setup
```

This will prompt for:
1. Wallet private key (keep secure!)
2. Blockchain RPC URL
3. IPFS endpoint URL

## 💡 Usage Examples

### Basic Workflow
```bash
# Setup
bvc config --setup

# Create repository
bvc init my-app
cd my-app

# Development (free local commits)
echo "console.log('Hello');" > app.js
bvc add app.js
bvc commit -m "Add basic app"

echo "console.log('Hello World');" > app.js
bvc add app.js
bvc commit -m "Improve greeting"

# Efficient blockchain sync
bvc checkpoint --message "Initial app development"
```

### Cost Comparison
```bash
# Traditional approach (expensive)
bvc commit --blockchain -m "commit 1"  # Gas fee #1
bvc commit --blockchain -m "commit 2"  # Gas fee #2
bvc commit --blockchain -m "commit 3"  # Gas fee #3

# BVC approach (efficient)
bvc commit -m "commit 1"               # Free
bvc commit -m "commit 2"               # Free
bvc commit -m "commit 3"               # Free
bvc checkpoint --message "All commits" # Gas fee #1 only
```

### Version Control with Revert
```bash
# View commit history
bvc log

# Revert to previous version
bvc revert 436b0deb               # Revert to specific commit
bvc status                        # Check restored files

# Continue development
bvc add . && bvc commit -m "Fix after revert"
```

## 🏗️ Architecture

### Repository Structure
```
my-project/
├── .bvc/
│   ├── config.json      # Repository configuration
│   ├── commits.json     # Local commit history
│   ├── staging.json     # Staged files
│   └── user-config.json # User blockchain config
├── .bvcignore          # Ignore patterns
└── README.md           # Project files
```

### Data Flow
1. **Local Commits**: Files hashed and stored locally
2. **IPFS Upload**: File contents uploaded to IPFS on checkpoint
3. **Blockchain Anchor**: Commit metadata anchored on Ethereum
4. **Merkle Proofs**: Cryptographic integrity verification

## 🔧 Troubleshooting

### Common Issues

#### "Blockchain configuration required"
```bash
# Solution: Configure blockchain first
bvc config --setup
```

#### "IPFS node not available"
```bash
# Install IPFS
# Option 1: Use public gateway
bvc config --ipfs-endpoint https://ipfs.infura.io:5001

# Option 2: Run local IPFS node
ipfs daemon
```

#### "Repository does not exist"
- Ensure repository was created with `bvc init`
- Check repository ID with `bvc status`

### Network Requirements
- **Sepolia Testnet**: For testing (recommended)
- **Ethereum Mainnet**: For production use
- **IPFS**: For decentralized file storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## � Documentation

### 🚀 Getting Started
- **[Quick Start Guide](QUICK_START.md)** - 5-minute setup and basic usage
- **[Usage Examples](USAGE_EXAMPLES.md)** - Real-world scenarios and workflows

### 💰 Cost Optimization
- **[Cost Optimization Guide](COST_OPTIMIZATION.md)** - Save 50-90% on gas fees
- **Key Features:**
  - ✅ Local commits (free)
  - ✅ Blockchain checkpoints (efficient batching)
  - ✅ IPFS integration

### 📋 Commands & Reference
- **[Command Reference](BVC_COMMAND_GUIDE.md)** - Complete command documentation
- **[Technical Architecture](bvc_documentation.md)** - System design and internals

### 🔧 Setup & Configuration
- **[RPC Guide](RPC_GUIDE.md)** - Blockchain network configuration
- **[Sepolia Deployment](SEPOLIA_DEPLOYMENT.md)** - Testnet deployment guide

## 🔗 Links

- [GitHub Repository](https://github.com/Lviffy/BVC)
- [NPM Package](https://www.npmjs.com/package/bvc-eth)
```bash
echo "console.log('Hello BVC!');" > index.js
bvc-eth add index.js
bvc-eth commit -m "Initial commit"
```

### 4. Push to Blockchain
```bash
bvc-eth push
```

### 5. View History
```bash
bvc-eth log
```

### 6. Collaborate
```bash
# Share your repository ID with others
bvc-eth list --mine

# Others can clone your repository
bvc-eth clone <your-repo-id>

# Pull latest changes
bvc-eth pull
```

## 📋 Commands

| Command | Description | Status |
|---------|-------------|---------|
| `bvc-eth init [name]` | Create new repository | ✅ Working |
| `bvc-eth config` | Configure wallet/blockchain | ✅ Working |
| `bvc-eth add <files>` | Stage files for commit | ✅ Working |
| `bvc-eth commit -m "msg"` | Create commit with IPFS upload | ✅ Working |
| `bvc-eth status` | Show repository status | ✅ Working |
| `bvc-eth log` | View commit history | ✅ Working |
| `bvc-eth push` | Push commits to blockchain | ✅ Working |
| `bvc-eth pull` | Pull commits from blockchain | ✅ Working |
| `bvc-eth clone <id>` | Clone repository from blockchain | ✅ Working |
| `bvc-eth checkpoint` | Create commit batches | ✅ Working |
| `bvc-eth list` | List all repositories | ✅ Working |

## ⚙️ Configuration

BVC requires configuration for blockchain and IPFS integration:

```bash
bvc config --setup
```

Required settings:
- **Private Key**: Your wallet private key
- **RPC URL**: Blockchain RPC endpoint (Sepolia, Mainnet, etc.)
- **IPFS Endpoint**: IPFS node URL

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   BVC CLI       │───▶│  Smart Contract  │───▶│   Blockchain    │
│   (Commander)   │    │   (Solidity)     │    │   (Ethereum)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  File Hashing    │    │      IPFS       │
│   (.bvc/)       │    │   (SHA256)       │    │  (Distributed)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧪 Testing

```bash
npm test
```

## 📜 License

MIT © [Lviffy](https://github.com/Lviffy)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 📧 Issues: [GitHub Issues](https://github.com/Lviffy/BVC/issues)
- 📖 Documentation: [Command Guide](./BVC_COMMAND_GUIDE.md)
- 🌐 Website: [GitHub Repository](https://github.com/Lviffy/BVC)

---

**⚠️ Note**: This is an early-stage project. Use at your own risk and test thoroughly before production use.
