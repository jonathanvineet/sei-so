const hre = require("hardhat");

async function main() {
  const DeliveryEscrow = await hre.ethers.getContractFactory("DeliveryEscrow");
  const escrow = await DeliveryEscrow.deploy();
  await escrow.waitForDeployment();
  console.log("Escrow deployed to:", escrow.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
