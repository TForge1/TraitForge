const { expect } = require("chai");
const { ethers } = require("hardhat");

// Define some constants for testing
const LISTING_PRICE = ethers.utils.parseEther("1.0");

async function deployContracts() {
  // Deploy TraitForgeNft
  const TraitForgeNft = await ethers.getContractFactory("TraitForgeNft");
  const traitForgeNft = await TraitForgeNft.deploy(); // Assuming it doesn't require arguments
  await traitForgeNft.deployed();

  // Deploy EntropyGenerator with TraitForgeNft's address
  const EntropyGenerator = await ethers.getContractFactory("EntropyGenerator");
  const entropyGenerator = await EntropyGenerator.deploy(traitForgeNft.address);
  await entropyGenerator.deployed();

  // If TraitForgeNft needs to use EntropyGenerator, set it here
  // Assuming there is a setter function in TraitForgeNft (uncomment if necessary)
  // await traitForgeNft.setEntropyGenerator(entropyGenerator.address);

  // Deploy EntityTrading with TraitForgeNft's address
  const EntityTrading = await ethers.getContractFactory("EntityTrading");
  const entityTrading = await EntityTrading.deploy(traitForgeNft.address);
  await entityTrading.deployed();

  // Assuming this sets up some necessary approvals between TraitForgeNft and EntityTrading
  await traitForgeNft.setApprovalForAll(entityTrading.address, true);

  return { traitForgeNft, entropyGenerator, entityTrading };
}

describe("EntityTrading", function () {
  let traitForgeNft;
  let iTraitForgeNft;
  let entityTrading;
  let owner;
  let buyer;
  let nukeFundAddress;
  let tokenId; // This will be dynamically assigned based on the mint event

  before(async function () {
    // Deploy contracts
    ({ traitForgeNft, entityTrading } = await deployContracts());

    // Get signers
    [owner, buyer] = await ethers.getSigners();

    // Casting the deployed TraitForgeNft as its interface
    iTraitForgeNft = await ethers.getContractAt("ITraitForgeNft", traitForgeNft.address);

    // Mint an NFT using the interface
    const mintPrice = await iTraitForgeNft.calculateMintPrice();
    const mintTx = await iTraitForgeNft.connect(owner).mintToken(owner.address, { value: mintPrice });
    const receipt = await mintTx.wait();

    // Extract tokenId from the mint transaction's 'Minted' event
    const event = receipt.events.find(e => e.event === 'Minted');
    if (!event) throw new Error("Minted event not found");
    const tokenId = event.args.itemId; // Ensure you're using the correct property name as defined in the event parameters

    // Store tokenId for use in subsequent tests
    this.tokenId = tokenId;

    // Approve the EntityTrading contract to transfer the NFT on behalf of the owner
    await traitForgeNft.connect(owner).approve(entityTrading.address, tokenId);

    // List the NFT for sale
    await entityTrading.connect(owner).listNFTForSale(tokenId, LISTING_PRICE);

    tokenId = event.args.itemId;
});


  it("should list an NFT for sale", async function () {
    const listing = await entityTrading.listings(tokenId);
    expect(listing.seller).to.equal(owner.address);
    expect(listing.price).to.equal(LISTING_PRICE);
    expect(listing.isActive).to.be.true;
  });

  it("should allow a buyer to purchase the listed NFT", async function () {
    const initialBalance = await buyer.getBalance();

    await expect(
      entityTrading.connect(buyer).buyNFT(TOKEN_ID, { value: LISTING_PRICE })
    )
      .to.emit(entityTrading, "NFTSold")
      .withArgs(
        TOKEN_ID,
        owner.address,
        buyer.address,
        LISTING_PRICE.div(10),
        LISTING_PRICE.sub(LISTING_PRICE.div(10))
      );

    const listing = await entityTrading.listings(TOKEN_ID);
    expect(listing.isActive).to.be.false;

    // Check the balances after the purchase
    const finalBalance = await buyer.getBalance();
    expect(finalBalance).to.be.above(initialBalance.sub(LISTING_PRICE));
  });

  it("should allow the seller to cancel the listing", async function () {
    await entityTrading.cancelListing(TOKEN_ID);

    const listing = await entityTrading.listings(TOKEN_ID);
    expect(listing.isActive).to.be.false;

    // Check if the NFT is transferred back to the owner
    const ownerBalance = await traitForgeNft.balanceOf(owner.address);
    expect(ownerBalance).to.equal(1);
  });

  it("should handle NukeFund contributions correctly", async function () {
    const initialNukeFundBalance = await ethers.provider.getBalance(nukeFundAddress);

    await entityTrading.listNFTForSale(TOKEN_ID, LISTING_PRICE);

    await expect(
      entityTrading.connect(buyer).buyNFT(TOKEN_ID, { value: LISTING_PRICE })
    )
      .to.emit(entityTrading, "NukeFundContribution")
      .withArgs(entityTrading.address, LISTING_PRICE.div(10));

    // Check the NukeFund balance after the purchase
    const finalNukeFundBalance = await ethers.provider.getBalance(nukeFundAddress);
    expect(finalNukeFundBalance.sub(initialNukeFundBalance)).to.equal(LISTING_PRICE.div(10));
  });
});
