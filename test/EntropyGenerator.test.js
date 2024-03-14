const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EntropyGenerator", function () {
  let EntropyGenerator;
  let entropyGenerator;
  let owner;
  let allowedCaller;
  let user;

  before(async function () {
    [owner, allowedCaller, user] = await ethers.getSigners();

    // Deploy the contract
    EntropyGenerator = await ethers.getContractFactory("EntropyGenerator");
    entropyGenerator = await EntropyGenerator.deploy(
      allowedCaller.address,
      owner.address
    );

    await entropyGenerator.deployed();
  });

  it("should set the allowed caller", async function () {
    const newAllowedCaller = user.address;

    await entropyGenerator.connect(owner).setAllowedCaller(newAllowedCaller);

    const updatedCaller = await entropyGenerator.allowedCaller();
    expect(updatedCaller).to.equal(newAllowedCaller);
  });

  it("should write entropy batches", async function () {
    // Write entropy batch 1
    await entropyGenerator.writeEntropyBatch1();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(256);

    // Write entropy batch 2
    await entropyGenerator.writeEntropyBatch2();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(512);

    // Write entropy batch 3
    entropyGenerator.writeEntropyBatch3();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(770);
  });

  it("should retrieve the next entropy", async function () {
    // Mock the allowed caller to be the TraitForgeNft contract
    await entropyGenerator.setAllowedCaller(allowedCaller.address);

    // Retrieve the next entropy
    const entropy = await entropyGenerator.getNextEntropy();
    expect(entropy).to.be.a("number");
  });

  it("should set entropy slot", async function () {
    const index = 42;
    const value = 123456789;

    await entropyGenerator.setEntropySlot(index, value);

    const retrievedValue = await entropyGenerator.entropySlots(index);
    expect(retrievedValue).to.equal(value % 10 ** 78);
  });

  it("should derive token parameters", async function () {
    const slotIndex = 42;
    const numberIndex = 7;

    const [nukeFactor, breedPotential, performanceFactor, isSire] =
      await entropyGenerator.deriveTokenParameters(slotIndex, numberIndex);

    expect(nukeFactor).to.be.a("number");
    expect(breedPotential).to.be.a("number");
    expect(performanceFactor).to.be.a("number");
    expect(isSire).to.be.a("boolean");
  });
});
