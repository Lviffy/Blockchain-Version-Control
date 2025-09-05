# Blockchain Version Control (BVC)

A decentralized version control system inspired by Git, but powered by blockchain and IPFS.

## Installation

```bash
npm install -g
```

Or run locally:

```bash
node bin/bvc.js <command>
```

## Usage

### Initialize a repository
```bash
bvc init <repo-name>
```

### Configure wallet
```bash
bvc config --wallet <your-wallet-address>
```

### Stage files
```bash
bvc add <file>
```

### Commit changes
```bash
bvc commit -m "Commit message"
```

### View history
```bash
bvc log
```

### Check status
```bash
bvc status
```

## Current Status

✅ Basic CLI structure  
✅ Local repository management (init, add, commit, log, status)  
✅ File staging and hashing  
⏳ IPFS integration  
⏳ Blockchain integration  
⏳ Push/Pull functionality  
⏳ Checkpoint system  

## Next Steps

1. Implement IPFS file upload in commit
2. Add smart contract for on-chain commit recording
3. Implement push/pull with blockchain/IPFS
4. Add checkpoint batching
5. Enhance status to show untracked files
