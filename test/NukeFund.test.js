const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NukeFund", function () {
  let owner, user1;
  let nukeFund, erc721Contract;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy ERC721Contract
    const ERC721Contract = await ethers.getContractFactory("TraitForgeNft");
    erc721Contract = await ERC721Contract.deploy();
    await erc721Contract.deployed();

    // Deploy NukeFund
    const NukeFund = await ethers.getContractFactory("NukeFund");
    nukeFund = await NukeFund.deploy(erc721Contract.address, owner.address);
    await nukeFund.deployed();
  });

  it("should allow the owner to update the ERC721 contract address", async function () {
    const newERC721Contract = await ethers.getContractFactory("TraitForgeNft");
    const newERC721Instance = await newERC721Contract.deploy();

    await expect(
      nukeFund
        .connect(owner)
        .setERC721ContractAddress(newERC721Instance.address)
    )
      .to.emit(nukeFund, "ERC721ContractAddressUpdated")
      .withArgs(newERC721Instance.address);

    expect(await nukeFund.erc721Contract()).to.equal(newERC721Instance.address);
  });

  it("should receive funds and distribute dev share", async function () {
    const initialFundBalance = await nukeFund.getFundBalance();
    const devShare = ethers.utils.parseEther("0.1"); // 10% of the sent amount

    await expect(() =>
      user1.sendTransaction({ value: ethers.utils.parseEther("1") })
    ).to.changeEtherBalance(nukeFund, ethers.utils.parseEther("0.9"));

    const newFundBalance = await nukeFund.getFundBalance();
    expect(newFundBalance).to.equal(
      initialFundBalance.add(ethers.utils.parseEther("0.9"))
    );

    const devBalance = await ethers.provider.getBalance(nukeFund.devAddress);
    expect(devBalance).to.equal(devShare);
  });

  it("should calculate the age of a token", async function () {
    const tokenId = 1;

    // Mock token creation timestamp and entropy
    await erc721Contract.mint(owner.address, tokenId);
    await erc721Contract.setTokenCreationTimestamp(
      tokenId,
      Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60
    );
    await erc721Contract.setEntropy(tokenId, 12345);

    const age = await nukeFund.calculateAge(tokenId);
    expect(age).to.be.a("number");
  });

  // Add more test cases as needed...

  it("should nuke a token", async function () {
    const tokenId = 1;

    // Mint a token
    await erc721Contract.mint(owner.address, tokenId);

    // Send some funds to the contract
    await user1.sendTransaction({ value: ethers.utils.parseEther("1") });

    // Calculate nuke factor
    const nukeFactor = await nukeFund.calculateNukeFactor(tokenId);

    // Ensure the token can be nuked
    expect(await nukeFund.canTokenBeNuked(tokenId)).to.be.true;

    // Nuke the token
    await expect(() =>
      nukeFund.connect(owner).nuke(tokenId)
    ).to.changeEtherBalance(
      user1,
      ethers.utils.parseEther((nukeFactor * 0.01).toString())
    );

    // Check if the token is burned
    expect(await erc721Contract.ownerOf(tokenId)).to.equal(
      ethers.constants.AddressZero
    );

    // Check if the fund balance is updated
    expect(await nukeFund.getFundBalance()).to.equal(0);
  });
});
