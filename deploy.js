const hre = require("hardhat");

async function main() {
  // Deploy EntropyGenerator
  const EntropyGenerator = await hre.ethers.getContractFactory("EntropyGenerator");
  const entropyGenerator = await EntropyGenerator.deploy(/* TraitForgeNft Address Placeholder */);
  await entropyGenerator.deployed();
  console.log("EntropyGenerator deployed to:", entropyGenerator.address);

  // Deploy TraitForgeNft with EntropyGenerator address
  const TraitForgeNft = await hre.ethers.getContractFactory("TraitForgeNft");
  const traitForgeNft = await TraitForgeNft.deploy(/* Owner Address */, /* NukeFund Address Placeholder */, entropyGenerator.address);
  await traitForgeNft.deployed();
  console.log("TraitForgeNft deployed to:", traitForgeNft.address);

  // Update EntropyGenerator with correct TraitForgeNft address
  const updateEntropyGeneratorTx = await entropyGenerator.setAllowedCaller(traitForgeNft.address);
  await updateEntropyGeneratorTx.wait();

  // Deploy DAOFund with your token address
  const DAOFund = await hre.ethers.getContractFactory("DAOFund");
  const daoFund = await DAOFund.deploy(/* Token Address Placeholder */);
  await daoFund.deployed();
  console.log("DAOFund deployed to:", daoFund.address);

  // Deploy EntityMerging with necessary addresses
  const EntityMerging = await hre.ethers.getContractFactory("EntityMerging");
  const entityMerging = await EntityMerging.deploy(/* Owner Address */, /* NukeFund Address Placeholder */, entropyGenerator.address, traitForgeNft.address);
  await entityMerging.deployed();
  console.log("EntityMerging deployed to:", entityMerging.address);

  // Deploy NukeFund with TraitForgeNft address
  const NukeFund = await hre.ethers.getContractFactory("NukeFund");
  const nukeFund = await NukeFund.deploy(traitForgeNft.address);
  await nukeFund.deployed();
  console.log("NukeFund deployed to:", nukeFund.address);

  // Set DAOFund and EntityMerging addresses in TraitForgeNft
  const setDAOFundTx = await traitForgeNft.setDAOFundAddress(daoFund.address);
  await setDAOFundTx.wait();
  
  const setEntityMergingTx = await traitForgeNft.setEntityMergingContract(entityMerging.address);
  await setEntityMergingTx.wait();

  // Additional setups like setting other contract addresses or initial states can be added here
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
