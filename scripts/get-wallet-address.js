require("dotenv").config();
const { ethers } = require("ethers");

function main() {
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log("❌ Private key not set in .env file");
        return;
    }

    // Add 0x prefix if not present
    const formattedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    const wallet = new ethers.Wallet(formattedKey);
    
    console.log("🔑 Your Wallet Address:");
    console.log(wallet.address);
    console.log("\n💰 Get test ETH from:");
    console.log("https://sepoliafaucet.com");
    console.log("\n📋 Copy this address and paste it into the faucet:");
    console.log(wallet.address);
}

main();
