# 🔧 BVC Command Reference

## 📋 Quick Reference

| Command | Description | Example |
|---------|-------------|---------|
| `bvc init` | Initialize new repository | `bvc init my-project` |
| `bvc clone` | Clone existing repository | `bvc clone 0x123abc...` |
| `bvc config` | Configure user settings | `bvc config --wallet 0x456def...` |
| `bvc add` | Stage files for commit | `bvc add index.js` |
| `bvc commit` | Create new commit | `bvc commit -m "Fix bug"` |
| `bvc status` | Show working tree status | `bvc status` |
| `bvc log` | View commit history | `bvc log --limit 10` |
| `bvc push` | Upload commits to blockchain | `bvc push` |
| `bvc pull` | Fetch latest changes | `bvc pull` |
| `bvc checkpoint` | Batch commit to blockchain | `bvc checkpoint main` |

---

## 📚 Detailed Commands

### Repository Management

#### `bvc init [repository-name]`
Initialize a new BVC repository
- Creates local `.bvc/` folder
- Generates repository ID
- Records initial state on blockchain

```bash
# Initialize with name
bvc init my-awesome-project

# Initialize in current directory
bvc init .

# Initialize with specific blockchain network
bvc init my-project --network sepolia
```

**Options:**
- `--network <network>` - Specify blockchain network (mainnet, sepolia, polygon)
- `--private` - Create private repository
- `--description <desc>` - Add repository description

---

#### `bvc clone <repository-id> [directory]`
Clone an existing repository from blockchain/IPFS

```bash
# Clone to current directory
bvc clone 0x123abc456def789...

# Clone to specific directory
bvc clone 0x123abc456def789... ./my-project

# Clone specific branch/commit
bvc clone 0x123abc456def789... --commit abc123def456
```

**Options:**
- `--commit <hash>` - Clone specific commit
- `--depth <number>` - Shallow clone with limited history
- `--branch <name>` - Clone specific branch (if supported)

---

#### `bvc config [key] [value]`
Configure BVC settings

```bash
# Set wallet address
bvc config wallet 0x123abc456def...

# Set private key (for signing)
bvc config private-key 0x789def123abc...

# Set IPFS node URL
bvc config ipfs-url https://ipfs.infura.io:5001

# Set default network
bvc config network polygon

# View all config
bvc config --list

# View specific config
bvc config wallet
```

**Common Config Keys:**
- `wallet` - Wallet address for commits
- `private-key` - Private key for signing transactions
- `ipfs-url` - IPFS node endpoint
- `network` - Default blockchain network
- `gas-price` - Default gas price for transactions

---

### File Operations

#### `bvc add <file/directory>`
Stage files for the next commit

```bash
# Add single file
bvc add index.js

# Add multiple files
bvc add index.js package.json

# Add directory
bvc add src/

# Add all files
bvc add .

# Add with pattern
bvc add *.js
```

**Options:**
- `--all` or `-A` - Add all modified files
- `--force` - Force add ignored files
- `--update` - Only add already tracked files

---

#### `bvc commit [options]`
Create a new commit with staged files

```bash
# Basic commit
bvc commit -m "Add new feature"

# Multi-line commit message
bvc commit -m "Fix critical bug

This resolves the issue where users couldn't login
after the recent update."

# Commit all modified files
bvc commit -am "Quick fix"

# Commit without uploading to blockchain (local only)
bvc commit -m "Work in progress" --local
```

**Options:**
- `-m <message>` - Commit message
- `-a` - Automatically stage modified files
- `--local` - Create local commit only (don't push to blockchain)
- `--author <address>` - Override commit author
- `--sign` - Sign commit with private key

---

#### `bvc status`
Show the working tree status

```bash
# Basic status
bvc status

# Short format
bvc status --short

# Include ignored files
bvc status --ignored
```

**Output shows:**
- Staged files (green)
- Modified files (red)
- Untracked files (white)
- Ignored files (gray, with --ignored)

---

### Synchronization

#### `bvc push [options]`
Push local commits to blockchain

```bash
# Push all pending commits
bvc push

# Push specific commit
bvc push abc123def456

# Push with custom gas price
bvc push --gas-price 20

# Push and wait for confirmation
bvc push --wait

# Dry run (simulate without executing)
bvc push --dry-run
```

**Options:**
- `--gas-price <price>` - Set gas price in gwei
- `--wait` - Wait for transaction confirmation
- `--dry-run` - Simulate push without executing
- `--force` - Force push (overwrite remote history)

---

#### `bvc pull [options]`
Fetch and integrate changes from blockchain/IPFS

```bash
# Pull latest changes
bvc pull

# Pull specific commit
bvc pull abc123def456

# Pull without auto-merge
bvc pull --no-merge

# Pull from specific repository
bvc pull 0x123abc456def789...
```

**Options:**
- `--no-merge` - Fetch without merging
- `--force` - Force pull (overwrite local changes)
- `--verify` - Verify IPFS content integrity

---

#### `bvc log [options]`
Display commit history

```bash
# Show recent commits
bvc log

# Limit number of commits
bvc log --limit 5

# Show commits by specific author
bvc log --author 0x123abc...

# Show commits since date
bvc log --since "2024-01-01"

# One line per commit
bvc log --oneline

# Show graph
bvc log --graph
```

**Options:**
- `--limit <number>` - Limit number of commits shown
- `--author <address>` - Filter by author address
- `--since <date>` - Show commits since date
- `--until <date>` - Show commits until date
- `--oneline` - Condensed output format
- `--graph` - Show branch/merge graph

---

### Advanced Operations

#### `bvc checkpoint [branch]`
Create a checkpoint by bundling multiple commits

```bash
# Checkpoint current branch
bvc checkpoint

# Checkpoint specific branch
bvc checkpoint main

# Checkpoint with custom message
bvc checkpoint --message "Weekly checkpoint"

# Checkpoint last N commits
bvc checkpoint --commits 5
```

**Options:**
- `--message <msg>` - Checkpoint description
- `--commits <number>` - Number of commits to include
- `--from <hash>` - Starting commit hash
- `--to <hash>` - Ending commit hash

---

#### `bvc fork <repository-id>`
Fork an existing repository

```bash
# Fork repository
bvc fork 0x123abc456def789...

# Fork with custom name
bvc fork 0x123abc456def789... --name my-fork

# Fork specific commit
bvc fork 0x123abc456def789... --commit abc123def
```

---

#### `bvc merge <commit-hash>`
Merge commits (repository owner only)

```bash
# Merge specific commit
bvc merge abc123def456

# Merge with message
bvc merge abc123def456 -m "Merge feature branch"
```

---

### Utility Commands

#### `bvc diff [commit1] [commit2]`
Show differences between commits

```bash
# Show working tree changes
bvc diff

# Compare staged changes
bvc diff --staged

# Compare two commits
bvc diff abc123 def456

# Show stats only
bvc diff --stat
```

---

#### `bvc show <commit-hash>`
Show detailed commit information

```bash
# Show latest commit
bvc show

# Show specific commit
bvc show abc123def456

# Show commit without diff
bvc show abc123def456 --no-diff
```

---

#### `bvc verify [commit-hash]`
Verify commit integrity and blockchain state

```bash
# Verify all commits
bvc verify

# Verify specific commit
bvc verify abc123def456

# Verify IPFS content
bvc verify --ipfs
```

---

#### `bvc remote`
Manage remote repositories

```bash
# List remotes
bvc remote

# Add remote
bvc remote add origin 0x123abc456def789...

# Remove remote
bvc remote remove origin

# Show remote info
bvc remote show origin
```

---

## 🔧 Global Options

These options work with most commands:

- `--help` - Show command help
- `--version` - Show BVC version
- `--verbose` - Verbose output
- `--quiet` - Suppress output
- `--network <name>` - Override default network
- `--config <file>` - Use custom config file

---

## 📝 Examples Workflow

```bash
# 1. Setup
bvc config wallet 0x123abc456def789...
bvc config network sepolia

# 2. Create new project
bvc init my-dapp
cd my-dapp

# 3. Add files and commit
echo "# My DApp" > README.md
bvc add README.md
bvc commit -m "Initial commit"

# 4. Push to blockchain
bvc push

# 5. Continue development
echo "console.log('Hello Web3!');" > index.js
bvc add index.js
bvc commit -m "Add main script"

# 6. Create checkpoint (batch multiple commits)
bvc checkpoint main

# 7. Clone existing project
bvc clone 0x987fed321cba... my-other-project
```