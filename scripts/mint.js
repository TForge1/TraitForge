const { ethers } = require("hardhat");

async function main() {
    const TraitForgeNftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const signer = (await ethers.getSigners())[0]; // Assuming you want to mint using the first signer

    // Correct usage of getContractAt with the contract name and address
    const TraitForgeNft = await ethers.getContractAt("TraitForgeNft", TraitForgeNftAddress, signer);

    // Minting a token with a manual gas limit
    const mintTx = await TraitForgeNft.mintToken(signer.address, {
        value: ethers.utils.parseEther("0.01"),
        gasLimit: 500000 // Manually set gas limit
    });

    await mintTx.wait();
    console.log("Token minted successfully.");
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
