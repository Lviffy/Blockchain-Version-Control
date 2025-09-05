const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Account balance check:");
  console.log("Account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.log("⚠️  Low balance! Get test ETH from: https://sepoliafaucet.com");
  } else {
    console.log("✅ Sufficient balance for deployment");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
