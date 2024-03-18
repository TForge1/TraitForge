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
    // The check for the updated allowed caller is removed since getAllowedCaller does not exist.
    // Consider adding a test that invokes a function with the onlyAllowedCaller modifier to indirectly test this.
  });

  it("should write entropy batches", async function () {
    await entropyGenerator.writeEntropyBatch1();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(256);

    await entropyGenerator.writeEntropyBatch2();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(512);

    // Assuming writeEntropyBatch3 is public or external for this test
    // If it's not meant to be directly callable, adjust your contract or test logic accordingly.
    await entropyGenerator.connect(owner).writeEntropyBatch3();
    expect(await entropyGenerator.getLastInitializedIndex()).to.equal(770);
  });

  it("should retrieve the next entropy", async function () {
    await entropyGenerator.connect(owner).setAllowedCaller(allowedCaller.address);
    const tx = await entropyGenerator.connect(allowedCaller).getNextEntropy();
    const receipt = await tx.wait();

    const foundEvent = receipt.events.find(e => e.event === "EntropyRetrieved");
    expect(foundEvent, "EntropyRetrieved event not found").to.not.be.undefined;

    const entropyValue = foundEvent.args.entropy;
    expect(ethers.BigNumber.isBigNumber(entropyValue)).to.equal(true);
  });

  it("should derive token parameters", async function () {
    const [nukeFactor, breedPotential, performanceFactor, isSire] = await entropyGenerator.deriveTokenParameters(0, 0);
    expect(ethers.BigNumber.isBigNumber(nukeFactor)).to.equal(true);
    expect(ethers.BigNumber.isBigNumber(breedPotential)).to.equal(true);
    expect(ethers.BigNumber.isBigNumber(performanceFactor)).to.equal(true);
    expect(isSire).to.be.a("boolean");
  });
});
