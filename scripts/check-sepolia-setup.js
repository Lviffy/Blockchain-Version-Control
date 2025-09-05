const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔧 BVC Sepolia Environment Check");
    console.log("================================");

    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const etherscanKey = process.env.ETHERSCAN_API_KEY;

    console.log("\n📋 Environment Variables:");
    console.log(`Private Key: ${privateKey ? '✅ Set (length: ' + privateKey.length + ')' : '❌ Missing'}`);
    console.log(`RPC URL: ${rpcUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`Etherscan API: ${etherscanKey && etherscanKey !== 'your_etherscan_api_key_here' ? '✅ Set' : '⚠️ Optional'}`);

    if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log("\n❌ SETUP REQUIRED:");
        console.log("1. Create a new wallet (MetaMask/other)");
        console.log("2. Export the private key");
        console.log("3. Update PRIVATE_KEY in .env file");
        console.log("4. Get test ETH from: https://sepoliafaucet.com");
        return;
    }

    if (!rpcUrl || rpcUrl.includes('YOUR_INFURA_PROJECT_ID')) {
        console.log("\n❌ SETUP REQUIRED:");
        console.log("1. Sign up at https://infura.io or https://alchemy.com");
        console.log("2. Create a new project");
        console.log("3. Copy the RPC URL");
        console.log("4. Update SEPOLIA_RPC_URL in .env file");
        return;
    }

    try {
        // Test connection to Sepolia
        console.log("\n🌐 Testing Sepolia Connection...");
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

        // Check wallet balance
        console.log("\n💰 Checking Wallet Balance...");
        const wallet = new ethers.Wallet(privateKey, provider);
        const balance = await wallet.getBalance();
        const balanceEth = ethers.utils.formatEther(balance);
        
        console.log(`Wallet Address: ${wallet.address}`);
        console.log(`Balance: ${balanceEth} ETH`);

        if (parseFloat(balanceEth) < 0.01) {
            console.log("⚠️ Low balance! Get test ETH from: https://sepoliafaucet.com");
        } else {
            console.log("✅ Sufficient balance for deployment");
        }

        console.log("\n🚀 Ready for Sepolia deployment!");
        console.log("Run: npm run deploy");

    } catch (error) {
        console.error("\n❌ Connection failed:", error.message);
        console.log("Check your RPC URL and network connection");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
