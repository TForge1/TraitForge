const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Deploy TraitForgeNft
  const TraitForgeNft = await hre.ethers.getContractFactory("TraitForgeNft");
  const traitForgeNft = await TraitForgeNft.deploy();
  await traitForgeNft.deployed();
  console.log("TraitForgeNft deployed to:", traitForgeNft.address);

  // Deploy ERC20FixedSupply token
  const ERC20FixedSupply = await hre.ethers.getContractFactory("ERC20FixedSupply");
  const myToken = await ERC20FixedSupply.deploy("MyToken", "MTK", 18); // Adjust name, symbol, and decimals as needed
  await myToken.deployed();
  console.log("ERC20FixedSupply deployed to:", myToken.address);

  // Deploy Staking contract using the deployed ERC20 token for staking and rewards
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    myToken.address, // Staking token address
    myToken.address, // Reward token address
    hre.ethers.utils.parseUnits("0.01", "ether"), // Reward per block
    86400 * 7 // Lockup duration
  );
  await staking.deployed();
  console.log("Staking deployed to:", staking.address);

  // Deploy NukeFund with the address of the TraitForgeNft and deployer's address as the devAddress
  const NukeFund = await hre.ethers.getContractFactory("NukeFund");
  const nukeFund = await NukeFund.deploy(traitForgeNft.address, deployer.address);
  await nukeFund.deployed();
  console.log("NukeFund deployed to:", nukeFund.address);

  // Deploy EntityTrading with the address of the NukeFund
  const EntityTrading = await hre.ethers.getContractFactory("EntityTrading");
  const tradeEntities = await EntityTrading.deploy(nukeFund.address);
  await tradeEntities.deployed();
  console.log("TradeEntities deployed to:", tradeEntities.address);

  // Deploy EntropyGenerator with the address of the TraitForgeNft and deployer's address as the initialOwner
  const EntropyGenerator = await hre.ethers.getContractFactory("EntropyGenerator");
  const entropyGenerator = await EntropyGenerator.deploy(traitForgeNft.address);
  await entropyGenerator.deployed();
  console.log("EntropyGenerator deployed to:", entropyGenerator.address);

  // Set NukeFund and EntropyGenerator addresses in TraitForgeNft
  await traitForgeNft.setNukeFundContract(nukeFund.address);
  console.log("NukeFundContract set in TraitForgeNft");
  await traitForgeNft.setEntropyGenerator(entropyGenerator.address);
  console.log("EntropyGeneratorAddress set in TraitForgeNft");

  // Deploy DAOFund using the deployed ERC20 token address
  const DAOFund = await hre.ethers.getContractFactory("DAOFund");
  const daoFund = await DAOFund.deploy(myToken.address);
  await daoFund.deployed();
  console.log("DAOFund deployed to:", daoFund.address);

  // Deploy EntityMerging with addresses of deployed contracts
  const EntityMerging = await hre.ethers.getContractFactory("EntityMerging");
  const entityMerging = await EntityMerging.deploy(traitForgeNft.address);
  await entityMerging.deployed();
  console.log("EntityMerging deployed to:", entityMerging.address);

  // Further setup can go here (e.g., connecting contracts if needed)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });