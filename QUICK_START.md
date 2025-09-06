# 🚀 BVC Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Install BVC
```bash
npm install -g bvc-eth
```

### 2. Configure (Required)
```bash
bvc config --setup
```
**You'll need:**
- Ethereum wallet private key
- RPC URL (Sepolia recommended)
- IPFS endpoint

### 3. Create Repository
```bash
bvc init my-project
cd my-project
```

### 4. Start Coding (Free!)
```bash
echo "console.log('Hello BVC!');" > app.js
bvc add app.js
bvc commit -m "Initial commit"  # FREE - No gas fees!
```

### 5. Publish Efficiently
```bash
bvc checkpoint --message "Ready for review"  # Single gas transaction
```

## 💰 Cost Optimization

| Action | Cost | When to Use |
|--------|------|-------------|
| `bvc commit` | **FREE** | Development work |
| `bvc checkpoint` | **1 gas fee** | Publishing batches |
| `bvc push` | **1 gas per commit** | ⚠️ Expensive |

**Pro Tip:** Make 10 local commits, then 1 checkpoint = **90% savings!**

## 📋 Common Workflows

### Development Loop
```bash
# Edit files
vim app.js

# Stage and commit (free)
bvc add app.js
bvc commit -m "Fix bug"

# Repeat as needed...

# Publish efficiently
bvc checkpoint -m "Sprint complete"
```

### Check Status
```bash
bvc status    # See staged/untracked files
bvc log       # View commit history
```

### Collaboration
```bash
# Clone existing repo
bvc clone <repo-id>

# Pull latest changes
bvc pull

# Push your work
bvc checkpoint -m "Add feature X"
```

## 🔧 Troubleshooting

### "Blockchain configuration required"
```bash
bvc config --setup
```

### "IPFS node not available"
```bash
# Use public gateway
bvc config --ipfs-endpoint https://ipfs.infura.io:5001
```

### Need Local Repository Only?
```bash
bvc init --local-only my-project
```

## 📚 Next Steps

- Read [README.md](README.md) for complete documentation
- Check [BVC_COMMAND_GUIDE.md](BVC_COMMAND_GUIDE.md) for all commands
- Join our community for support

**Happy coding with BVC! 🎉**</content>
<parameter name="filePath">/home/luffy/Projects/Blockchain-Version-Control/QUICK_START.md
