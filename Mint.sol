// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenPool.sol";

contract Mint is ERC721, Ownable, ReentrancyGuard {
    TokenPool private tokenPool; 
    address public honeypotAddress;
    uint256 public currentGeneration = 1;
    uint256 public burnedTokenCount = 0;

    address public addressOfBreeadbleTokenContract;
    address public addressOfNukeFundContract;

    mapping(uint256 => uint256) public generationMintCounts;
    mapping(uint256 => bool) public isTokenBurned;
    mapping(uint256 => uint256) public tokenMintTimeStamp;

    uint256 public constant START_PRICE = 0.01 ether;
    uint256 public mintedCount = 0;
    uint256 public constant PRICE_INCREMENT = 0.01 ether;
    uint256 public constant MAX_ENTITIES = 10000;
    uint256 public constant MAX_TOKENS_PER_GEN = 10000;

    constructor(address _tokenPoolAddress, address _honeypotAddress)
    ERC721("Gen1Entity", "G1E")
    Ownable(msg.sender) // Pass the message sender's address to the Ownable constructor
{
    tokenPool = TokenPool(_tokenPoolAddress);
    honeypotAddress = _honeypotAddress;
}

    function mint(uint256 tokenId) public payable nonReentrant {
        require(generationMintCounts[currentGeneration] < MAX_TOKENS_PER_GEN, "Generation limit reached");
        uint256 currentPrice = START_PRICE + (mintedCount * PRICE_INCREMENT);
        require(mintedCount < MAX_ENTITIES, "All entities minted for current generation");
        require(tokenId <= MAX_ENTITIES, "Token ID out of bounds");
        require(msg.value >= currentPrice, "Ether sent is not correct");

        uint256 devShare = msg.value / 10;
        uint256 honeypotShare = msg.value - devShare;
        payable(honeypotAddress).transfer(honeypotShare);

        generationMintCounts[currentGeneration]++;
        mintedCount++;
        tokenPool.generateTokenData(tokenId); 
        tokenMintTimeStamp[tokenId] = block.timestamp;

        if (generationMintCounts[currentGeneration] >= MAX_TOKENS_PER_GEN) {
            advanceGeneration();
        }
    }
    function advanceGeneration() private {
        currentGeneration++;
        generationMintCounts[currentGeneration] = 0; 
        mintedCount = 0; 
        tokenPool.updateGeneration(currentGeneration); 
    }
    function setTokenPool(address _tokenPoolAddress) external onlyOwner {
        tokenPool = TokenPool(_tokenPoolAddress);
    }
     function setAddressOfbeedableTokenContract(address _address) external onlyOwner {
        addressOfBreedableTokenContract = _address;
    }
    function setAddressOfNukeFundContract(address _address) external onlyOwner {
        addressOfNukeFundContract = _address;
    }
    function markTokenAsBurned(uint256 tokenId) external {
        require(msg.sender == addressOfBreedableTokenContract || msg.sender == addressOfNukeFundContract, "Caller not authorized");

        require(_exists(tokenId), "Token does not exist");
        requrie(!isTokenBurned[tokenId], "Token already marked as burned");

        isTokenBurned[tokenId] = true;
        burnedTokenCount += 1;
    }
}