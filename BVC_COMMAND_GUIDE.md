# 🔗 BVC Command Guide - Currently Working Features

## 📋 Overview

BVC (Blockchain Version Control) is a decentralized Git-like version control system that stores commits on the blockchain and files on IPFS. This guide covers the **currently implemented and working** features.

## ✅ Working Commands

### Repository Setup

#### `bvc init [repository-name]`
Initialize a new BVC repository and create it on the blockchain.

```bash
# Initialize with name
bvc init my-project

# Initialize in current directory
bvc init .

# Interactive mode
bvc init --interactive
```

**Features:**
- Creates local `.bvc/` directory
- Generates unique repository ID
- Records repository on blockchain
- Supports interactive setup

---

#### `bvc config [options]`
Configure BVC settings for wallet, blockchain, and IPFS.

```bash
# Interactive setup
bvc config --setup

# Set wallet private key
bvc config --private-key 0x123abc...

# Set blockchain RPC URL
bvc config --rpc-url https://sepolia.infura.io/v3/YOUR_KEY

# Set IPFS endpoint
bvc config --ipfs-endpoint https://ipfs.infura.io:5001

# Show current configuration
bvc config --show

# Reset configuration
bvc config --reset
```

**Required Configuration:**
- `private-key` - Your wallet private key for signing transactions
- `rpc-url` - Blockchain RPC endpoint (e.g., Sepolia, Mainnet)
- `ipfs-endpoint` - IPFS node URL for file storage

---

### File Operations

#### `bvc add <files...>`
Stage files for the next commit.

```bash
# Add single file
bvc add index.js

# Add multiple files
bvc add index.js package.json

# Add directory
bvc add src/

# Add all files in current directory
bvc add .

# Add with glob patterns
bvc add *.js
```

**Features:**
- SHA256 file hashing
- Supports glob patterns
- Creates staging area for commit

---

#### `bvc commit -m "message"`
Create a new commit with staged files.

```bash
# Basic commit
bvc commit -m "Add new feature"

# Multi-line commit message
bvc commit -m "Fix critical bug

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
