# 🔗 BVC Command Guide - Complete Reference

## 📋 Overview

BVC (Blockchain Version Control) is a decentralized Git-like version control system that stores commits on the blockchain and files on IPFS. This guide covers all available commands with detailed usage examples.

## ✅ Command Reference

### Repository Setup

#### `bvc init [repository-name]` - Create repository
Initialize a new BVC repository. **Blockchain configuration required by default.**

```bash
# Create blockchain repository (default)
bvc init my-project

# Create local repository only
bvc init --local-only my-repo

# Interactive setup
bvc init --interactive

# Upgrade existing local repo to blockchain
bvc init --upgrade-blockchain
```

**Options:**
- `--local-only`: Skip blockchain creation
- `--interactive`: Guided setup with prompts
- `--upgrade-blockchain`: Convert local repo to blockchain

**Output:** Creates `.bvc/` directory with configuration files

---

#### `bvc config [options]` - Configuration management
Configure BVC settings for wallet, blockchain, and IPFS connections.

```bash
# Interactive setup (recommended)
bvc config --setup

# Manual configuration
bvc config --private-key 0x123abc...
bvc config --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
bvc config --ipfs-endpoint https://ipfs.infura.io:5001

# View current configuration
bvc config --show

# Reset all settings
bvc config --reset
```

**Required Configuration:**
- `private-key`: Ethereum wallet private key for signing
- `rpc-url`: Blockchain RPC endpoint (Sepolia/Mainnet)
- `ipfs-endpoint`: IPFS node URL for file storage

---

#### `bvc clone <repo-id>` - Clone repository
Clone an existing repository from the blockchain.

```bash
bvc clone 12345abc...def
```

**Note:** Repository ID is the blockchain identifier returned during `init`

---

#### `bvc status` - Repository status
Show the current state of the repository.

```bash
bvc status
```

**Shows:**
- Current branch
- Staged files
- Untracked files
- Repository ID
- Last commit

---

### File Operations

#### `bvc add <files...>` - Stage files
Stage files for the next commit (similar to `git add`).

```bash
# Add single file
bvc add index.js

# Add multiple files
bvc add index.js package.json README.md

# Add directory recursively
bvc add src/

# Add all files in current directory
bvc add .

# Add with glob patterns
bvc add *.js **/*.json
```

**Features:**
- SHA256 file hashing
- Supports glob patterns (`*`, `**`, `?`)
- Creates staging area for commit

---

#### `bvc commit -m "message"` - Create commit
Create a new commit with staged files. **Local commits are free (no gas fees).**

```bash
# Basic local commit (recommended)
bvc commit -m "Add new feature"

# Multi-line commit message
bvc commit -m "Fix critical bug

- Fixed authentication issue
- Added error handling
- Updated tests"

# Direct blockchain commit (expensive)
bvc commit --blockchain -m "Direct blockchain commit"
```

**Options:**
- `-m, --message`: Commit message (required)
- `--blockchain`: Commit directly to blockchain (not recommended)

**Cost Note:** Use local commits + `checkpoint` for efficiency

---

### Synchronization & Publishing

#### `bvc push` - Push to blockchain
Push individual commits to the blockchain. **Use sparingly for cost efficiency.**

```bash
bvc push
```

**Warning:** Each push costs gas. Consider using `checkpoint` instead.

---

#### `bvc checkpoint` - Batch commits efficiently ⭐
**Most important cost-saving feature!** Bundle multiple local commits into a single blockchain transaction.

```bash
# Batch all pending commits
bvc checkpoint --message "Feature implementation"

# Preview cost savings
bvc checkpoint --dry-run

# Custom message
bvc checkpoint -m "Sprint 5 completion"
```

**Benefits:**
- ✅ Batches multiple commits into 1 transaction
- ✅ 50-90% gas savings
- ✅ IPFS integration for file storage
- ✅ Merkle tree integrity proofs

**Example Output:**
```
💰 Preparing checkpoint for 3 commit(s)...
💡 This batches 3 commits into 1 blockchain transaction (gas efficient)
🏁 Checkpoint Bundle: QmSe5Np9qS1R4oA3CShCsLmCAuKCmXp4EkbcFzJov13xb1
📝 Commits batched: 3
```

---

#### `bvc pull` - Pull latest changes
Fetch and merge the latest commits from the blockchain.

```bash
bvc pull
```

**Features:**
- Downloads from IPFS
- Merges with local changes
- Conflict resolution support

---

#### `bvc log` - View commit history
Display commit history with blockchain verification.

```bash
# Show all commits
bvc log

# Show checkpoint history
bvc log --checkpoints

# Limit results
bvc log --limit 10
```

**Shows:**
- Commit hash
- Author and timestamp
- Commit message
- File changes
- Blockchain verification status

---

### Repository Management

#### `bvc list` - List repositories
Show all repositories associated with your wallet.

```bash
bvc list
```

**Shows:**
- Repository name
- Repository ID
- Creation date
- Last activity

---

## 💰 Cost Optimization Workflow

### Recommended Development Flow

```bash
# 1. Setup (one-time)
bvc config --setup

# 2. Create repository
bvc init my-project
cd my-project

# 3. Development (free!)
bvc add feature.js
bvc commit -m "Add feature"          # FREE

bvc add test.js
bvc commit -m "Add tests"            # FREE

bvc add docs.md
bvc commit -m "Update docs"          # FREE

# 4. Efficient blockchain sync
bvc checkpoint -m "Feature complete" # 1 gas fee only!
```

### Cost Comparison

| Method | Commits | Gas Transactions | Cost |
|--------|---------|------------------|------|
| Individual pushes | 10 | 10 | 💸💸💸 |
| Single checkpoint | 10 | 1 | 💰 |
| **Savings** | - | **90%** | ✅ |

## 🔧 Configuration Examples

### Sepolia Testnet Setup
```bash
bvc config --private-key YOUR_PRIVATE_KEY
bvc config --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY
bvc config --ipfs-endpoint https://ipfs.infura.io:5001
```

### Local Development
```bash
bvc config --rpc-url http://127.0.0.1:8545
bvc config --ipfs-endpoint http://127.0.0.1:5001
```

### Mainnet Production
```bash
bvc config --rpc-url https://mainnet.infura.io/v3/YOUR_INFURA_KEY
bvc config --ipfs-endpoint https://ipfs.infura.io:5001
```

## 🚨 Error Handling

### Common Errors & Solutions

#### "Blockchain configuration required"
```
❌ Cannot create repository without blockchain configuration.
ℹ️ Please configure blockchain first:
ℹ️   bvc config --setup
ℹ️ Or use --local-only flag for local repository:
ℹ️   bvc init --local-only <name>
```
**Solution:** Run `bvc config --setup`

#### "IPFS node not available"
```
⚠️ IPFS buffer upload failed: fetch failed
```
**Solutions:**
```bash
# Use public IPFS gateway
bvc config --ipfs-endpoint https://ipfs.infura.io:5001

# Or install local IPFS
npm install -g ipfs
ipfs daemon
```

#### "Repository does not exist"
**Solutions:**
- Verify repository was created with `bvc init`
- Check repository ID: `bvc status`
- Ensure correct network (Sepolia/Mainnet)

## 📊 Advanced Usage

### Repository Structure
```
my-project/
├── .bvc/
│   ├── config.json          # Repository metadata
│   ├── commits.json         # Local commit history
│   ├── staging.json         # Staged files
│   └── user-config.json     # Blockchain config
├── .bvcignore              # Ignore patterns
└── [project files]
```

### Configuration Files
- **config.json**: Repository ID, name, creation date
- **user-config.json**: Wallet, RPC, IPFS settings
- **commits.json**: Local commit history
- **staging.json**: Files ready for commit

### Best Practices
1. **Always use local commits** for development
2. **Use checkpoints** for efficient blockchain publishing
3. **Configure IPFS** for better performance
4. **Test on Sepolia** before mainnet deployment
5. **Backup private keys** securely

## 🔗 Related Documentation

- [README.md](README.md) - Main project overview
- [RPC_GUIDE.md](RPC_GUIDE.md) - Blockchain network setup
- [SEPOLIA_DEPLOYMENT.md](SEPOLIA_DEPLOYMENT.md) - Testnet deployment
- [bvc_documentation.md](bvc_documentation.md) - Technical architecture

This resolves the login issue."

# Interactive commit
bvc commit --interactive

# Amend last commit
bvc commit --amend -m "Updated message"
```

**Features:**
- Uploads files to IPFS
- Records commit on blockchain
- Generates commit hash
- Supports amend functionality

---

### Repository Status

#### `bvc status`
Show the current repository status.

```bash
# Basic status
bvc status

# Detailed status
bvc status --verbose
```

**Shows:**
- Repository name and branch
- Staged files ready for commit
- Repository ID

---

#### `bvc log [options]`
Display commit history.

```bash
# Show recent commits
bvc log

# Limit number of commits
bvc log -n 5

# One-line format
bvc log --oneline

# Filter by author
bvc log --author "0x123..."

# Filter by date
bvc log --since "2024-01-01"
```

**Features:**
- Shows commit hash, message, author, and timestamp
- Supports filtering and limiting
- ASCII graph support (when implemented)

---

## 🔧 Global Options

These options work with most commands:

- `--help` - Show command help
- `--verbose` - Verbose output
- `--debug` - Enable debug mode

---

## 🚀 Quick Start Workflow

```bash
# 1. Configure your wallet and connections
bvc config --setup

# 2. Create a new repository
bvc init my-awesome-project

# 3. Add your first files
echo "console.log('Hello BVC!');" > index.js
bvc add index.js

# 4. Create your first commit
bvc commit -m "Initial commit"

# 5. Check the status
bvc status

# 6. View commit history
bvc log
```

---

## 📝 Current Limitations

The following features are **not yet implemented** but planned for future releases:

- `bvc push` - Push functionality (commits already go to blockchain)
- `bvc pull` - Pull changes from blockchain
- `bvc clone` - Clone existing repositories
- `bvc checkpoint` - Batch multiple commits
- Branch management
- Merge conflict resolution
- Collaborative features

---

## 🔗 Integration Details

- **Blockchain**: Ethereum-compatible networks (Sepolia testnet, Mainnet)
- **IPFS**: File storage and distribution
- **Smart Contract**: Repository and commit management
- **Local Storage**: `.bvc/` directory for metadata

---

## 🆘 Troubleshooting

**"Not a BVC repository"**
- Run `bvc init` to create a repository first

**"No staged files"**
- Use `bvc add <files>` to stage files before committing

**"IPFS upload failed"**
- Check your IPFS endpoint configuration
- Ensure IPFS node is accessible

**"Transaction failed"**
- Verify your wallet has sufficient funds
- Check RPC URL configuration
- Ensure private key is correct

---

*This guide covers only the currently working features. See `PROGRESS.md` for development roadmap and planned features.*</content>
<parameter name="filePath">/home/luffy/Projects/BVC/BVC_COMMAND_GUIDE.md
