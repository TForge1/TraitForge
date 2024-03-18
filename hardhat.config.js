require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
// Your hardhat configuration continues here...


module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      // Configuration specific to Hardhat Network
      chainId: 1337 // Common chainId used for local development. Adjust if necessary.
    },
  },
};
