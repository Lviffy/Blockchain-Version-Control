const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BVC smart contract...");

  // Get the ContractFactory and Signers here.
  const BVC = await ethers.getContractFactory("BVC");
  const bvc = await BVC.deploy();

  await bvc.deployed();

  console.log("BVC deployed to:", bvc.address);

  // Save the contract address
  const contractsDir = path.join(__dirname, "..", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ BVC: bvc.address }, undefined, 2)
  );

  console.log("Contract address saved to contracts/contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
