const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const contractAddressPath = path.join(__dirname, "..", "contracts", "contract-address.json");
  
  if (!fs.existsSync(contractAddressPath)) {
    console.log("❌ Contract not deployed. Run 'npm run deploy' first.");
    return;
  }
  
  const contractData = JSON.parse(fs.readFileSync(contractAddressPath, "utf8"));
  const contractAddress = contractData.BVC;
  
  console.log("📋 BVC Contract Information");
  console.log("=".repeat(40));
  console.log("Address:", contractAddress);
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "(Chain ID:", network.chainId + ")");
  
  if (network.chainId === 11155111) {
    console.log("Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (network.chainId === 1337) {
    console.log("Network: Local Hardhat");
  }
  
  // Get contract instance
  const BVC = await ethers.getContractFactory("BVC");
  const bvc = BVC.attach(contractAddress);
  
  try {
    const repoIds = await bvc.getAllRepoIds();
    console.log("Repositories:", repoIds.length);
    
    if (repoIds.length > 0) {
      console.log("\n📁 Repositories:");
      for (const repoId of repoIds) {
        const repo = await bvc.getRepository(repoId);
        console.log(`  - ${repo.name} (${repoId})`);
        console.log(`    Owner: ${repo.owner}`);
        console.log(`    Created: ${new Date(repo.createdAt * 1000).toISOString()}`);
        
        const commits = await bvc.getCommits(repoId);
        console.log(`    Commits: ${commits.length}`);
      }
    }
  } catch (error) {
    console.log("❌ Error reading contract data:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
