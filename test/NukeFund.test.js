const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NukeFund Contract Tests", function () {
  let NukeFund, nukeFund;
  let TraitForgeNft, traitForgeNft;
  let owner, addr1, addr2, devAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, devAddress] = await ethers.getSigners();

    // Deploy the mock TraitForgeNft contract
    TraitForgeNft = await ethers.getContractFactory("TraitForgeNft");
    traitForgeNft = await TraitForgeNft.deploy();
    await traitForgeNft.deployed();

    // Deploy the NukeFund contract
    NukeFund = await ethers.getContractFactory("NukeFund");
    nukeFund = await NukeFund.deploy(traitForgeNft.address, devAddress.address);
    await nukeFund.deployed();
  });

  describe("Initialization", function () {
    it("should set initial owner, NFT contract, and dev address correctly", async function () {
      expect(await nukeFund.owner()).to.equal(owner.address);
      expect(await nukeFund.nftContract()).to.equal(traitForgeNft.address);
      expect(await nukeFund.devAddress()).to.equal(devAddress.address);
    });
  });

  describe("Receiving Funds", function () {
    it("should correctly split funds between fund and developer", async function () {
      const initialFundBalance = await nukeFund.getFundBalance();
      const initialDevBalance = await ethers.provider.getBalance(devAddress.address);

      // Simulate sending ETH to contract
      const tx = { to: nukeFund.address, value: ethers.utils.parseEther("1.0") };
      await owner.sendTransaction(tx);

      const finalFundBalance = await nukeFund.getFundBalance();
      const finalDevBalance = await ethers.provider.getBalance(devAddress.address);

      expect(finalFundBalance.sub(initialFundBalance)).to.equal(ethers.utils.parseEther("0.9"));
      expect(finalDevBalance.sub(initialDevBalance)).to.equal(ethers.utils.parseEther("0.1"));
    });
  });

  describe("Setting TraitForgeNft Contract", function () {
    it("should not allow non-owner to update the TraitForgeNft contract address", async function () {
      await expect(
        nukeFund.connect(addr1).setTraitForgeNftContract(addr2.address)
      ).to.be.revertedWith("OwnableUnauthorizedAccount"); // Update this line to match the actual revert reason
    });

    it("should not allow non-owner to update the TraitForgeNft contract address", async function () {
      await expect(
          nukeFund.connect(addr1).setTraitForgeNftContract(addr2.address)
      // Update this line to match the actual revert reason used in your contract
      ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });
  });

  // Add more tests here to cover calculateNukeFactor, nuke, and other functions...
});
