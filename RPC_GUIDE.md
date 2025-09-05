# Understanding RPC URLs in Blockchain Development

## What is an RPC URL?

**RPC = Remote Procedure Call**

The RPC URL is your **gateway to the blockchain**. It's the endpoint that allows your application to communicate with the Ethereum network without running your own blockchain node.

## How RPC URLs Work

```
Your BVC App ←→ RPC Provider ←→ Ethereum Network ←→ Smart Contracts
```

The RPC URL acts as a bridge between your application and the blockchain, handling all the complex networking and protocol details.

## What does an RPC URL do?

### 1. **Reads Blockchain Data**
- Get account balances
- Read smart contract state
- Fetch transaction history
- Query block information

### 2. **Sends Transactions**
- Deploy smart contracts
- Call contract functions
- Transfer tokens/ETH
- Create repositories (in your BVC case)

### 3. **Monitors Events**
- Listen for blockchain events
- Track transaction confirmations
- Monitor contract interactions

## RPC Providers Comparison

| Provider | URL Format | Benefits | Cost |
|----------|------------|----------|------|
| **Infura** | `https://sepolia.infura.io/v3/PROJECT_ID` | ✅ 99.9% uptime<br>✅ Professional infrastructure<br>✅ Fast response times | Free tier available |
| **Alchemy** | `https://eth-sepolia.g.alchemy.com/v2/API_KEY` | ✅ Advanced analytics<br>✅ Enhanced APIs<br>✅ Great documentation | Free tier available |
| **Public RPC** | `https://rpc.sepolia.org` | ✅ Completely free<br>✅ No registration needed | ⚠️ Slower<br>⚠️ Less reliable<br>⚠️ Rate limited |
| **Local Node** | `http://127.0.0.1:8545` | ✅ Full control<br>✅ No rate limits<br>✅ Privacy | ❌ Requires running own node<br>❌ Maintenance overhead |

## RPC URLs in Your BVC System

### Configuration Flow
```bash
# 1. Configure BVC to use Sepolia via Infura
bvc config --rpc-url https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# 2. BVC saves this configuration
# File: .bvc/user-config.json
{
  "rpcUrl": "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
  "privateKey": "your_private_key"
}
```

### What happens when you run BVC commands:

#### `bvc init my-project`
```
1. BVC reads RPC URL from config
2. Connects to Sepolia via Infura
3. Loads your deployed BVC contract
4. Sends transaction to create repository
5. Waits for confirmation
6. Returns repository ID
```

#### `bvc commit -m "message"`
```
1. Uploads files to IPFS
2. Uses RPC to send commit transaction
3. Records commit hash on blockchain
4. Links IPFS content to blockchain
```

## Network Types and RPC URLs

### Mainnet (Real Money!)
```bash
# Infura Mainnet
https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Public Mainnet (not recommended for production)
https://eth.public-rpc.com
```

### Testnets (Free Testing)
```bash
# Sepolia (recommended testnet)
https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Goerli (being deprecated)
https://goerli.infura.io/v3/YOUR_PROJECT_ID
```

### Local Development
```bash
# Hardhat local network
http://127.0.0.1:8545

# Ganache
http://127.0.0.1:7545
```

## Your Current Setup

Based on your `.env` file:

```properties
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/83fef17e5d5047e6b28be819f948bbd2
```

This means:
- ✅ You're using **Infura** (professional provider)
- ✅ Connected to **Sepolia testnet** (safe for testing)
- ✅ Project ID: `83fef17e5d5047e6b28be819f948bbd2`

## Troubleshooting RPC Issues

### Connection Failed
```bash
Error: could not detect network
```
**Solutions:**
- Check if RPC URL is correct
- Verify your internet connection
- Try a different RPC provider

### Rate Limits
```bash
Error: Too many requests
```
**Solutions:**
- Upgrade to paid Infura plan
- Use multiple RPC providers
- Add delays between requests

### Wrong Network
```bash
Error: network mismatch
```
**Solutions:**
- Ensure contract is deployed on the correct network
- Check your RPC URL matches your contract network

## Best Practices

### 🔒 Security
- Never commit RPC URLs with API keys to git
- Use environment variables for sensitive data
- Rotate API keys regularly

### ⚡ Performance
- Choose geographically close RPC providers
- Use paid tiers for production applications
- Implement connection pooling for high-traffic apps

### 🛡️ Reliability
- Have backup RPC providers configured
- Monitor RPC provider status pages
- Implement retry logic with exponential backoff

## Testing Your RPC Connection

Run this to verify your setup:
```bash
npm run check-setup
```

This script:
1. Validates your RPC URL
2. Tests connection to Sepolia
3. Checks your wallet balance
4. Confirms deployment readiness

## Next Steps

Now that your RPC is configured with Infura:
1. ✅ **Deploy to Sepolia** - `npm run deploy` (already done)
2. ✅ **Verify contract** - `npm run verify` (already done)
3. 🔄 **Test BVC workflow** - Create repositories and commits
4. 📊 **Monitor usage** - Check Infura dashboard for API usage

Your BVC system now has enterprise-grade blockchain connectivity through Infura! 🚀
