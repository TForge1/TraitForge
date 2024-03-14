// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// EntropyGenerator is a contract designed to generate pseudo-random values for use in other contracts
contract EntropyGenerator is Ownable {
    uint256[770] private entropySlots; // Array to store entropy values
    uint256 private lastInitializedIndex = 0; // Indexes to keep track of the initialization and usage of entropy values
    uint256 private currentSlotIndex = 0;
    uint256 private currentNumberIndex = 0;
    // Constants to define the limits for slots and numbers within those slots
    uint256 private constant MAX_SLOT_INDEX = 770;
    uint256 private constant MAX_NUMBER_INDEX = 13;

    address private allowedCaller;

    event AllowedCallerUpdated(address allowedCaller);

    constructor(
        address _TraitForgeNft,
        address initialOwner
    ) Ownable(initialOwner) {
        allowedCaller = _TraitForgeNft;
    }

    // Modifier to restrict certain functions to the allowed caller
    modifier onlyAllowedCaller() {
        require(msg.sender == allowedCaller, "Caller is not allowed");
        _;
    }

    // Function to update the allowed caller, restricted to the owner of the contract
    function setAllowedCaller(address _allowedCaller) external onlyOwner {
        allowedCaller = _allowedCaller;
        emit AllowedCallerUpdated(_allowedCaller); // Emit an event for this update.
    }

    // Functions to initalize entropy values inbatches to spread gas cost over multiple transcations
    function writeEntropyBatch1() public {
        require(lastInitializedIndex < 256, "Batch 1 already initialized.");

        uint256 endIndex = lastInitializedIndex + 256; // calculate the end index for the batch
        unchecked {
            for (uint256 i = lastInitializedIndex; i < endIndex; i++) {
                uint256 pseudoRandomValue = uint256(
                    keccak256(abi.encodePacked(block.number, i))
                ) % uint256(10) ** 78; // generate a  pseudo-random value using block number and index
                require(pseudoRandomValue != 999999, "Invalid value, retry.");
                entropySlots[i] = pseudoRandomValue; // store the value in the slots array
            }
        }
        lastInitializedIndex = endIndex;
    }

    // second batch initialization
    function writeEntropyBatch2() public {
        require(
            lastInitializedIndex >= 256 && lastInitializedIndex < 512,
            "Batch 2 not ready or already initialized."
        );

        uint256 endIndex = lastInitializedIndex + 256;
        unchecked {
            for (uint256 i = lastInitializedIndex; i < endIndex; i++) {
                uint256 pseudoRandomValue = uint256(
                    keccak256(abi.encodePacked(block.number, i))
                ) % uint256(10) ** 78;
                require(pseudoRandomValue != 999999, "Invalid value, retry.");
                entropySlots[i] = pseudoRandomValue;
            }
        }
        lastInitializedIndex = endIndex;
    }

    // allows setting a specific entropy slot with a value
    function writeEntropyBatch3() internal {
        require(
            lastInitializedIndex >= 512 && lastInitializedIndex < 770,
            "Batch 3 not ready or already completed."
        );
        unchecked {
            for (uint256 i = lastInitializedIndex; i < 770; i++) {
                uint256 pseudoRandomValue = uint256(
                    keccak256(abi.encodePacked(block.number, i))
                ) % uint256(10) ** 78;
                entropySlots[i] = pseudoRandomValue;
            }
        }
        lastInitializedIndex = 770;
    }

    // allows setting a specific entropy slot with value
    function setEntropySlot(uint256 index, uint256 value) public {
        require(index < 770, "Index out of bounds.");
        entropySlots[index] = value % uint256(10) ** 78;
    }

    // function to retrieve the next entropy value, accessible only by the allowed caller
    function getNextEntropy() public onlyAllowedCaller returns (uint256) {
        require(currentSlotIndex <= MAX_SLOT_INDEX, "Max slot index reached.");
        uint256 entropy = getEntropy(currentSlotIndex, currentNumberIndex);

        if (currentNumberIndex >= MAX_NUMBER_INDEX) {
            currentNumberIndex = 0;
            if (currentSlotIndex >= MAX_SLOT_INDEX - 1) {
                currentSlotIndex = 0;
            } else {
                currentSlotIndex++;
            }
        } else {
            currentNumberIndex++;
        }
        return entropy;
    }

    // private function to calculate the entropy value based on slot and number index
    function getEntropy(
        uint256 slotIndex,
        uint256 numberIndex
    ) private view returns (uint256) {
        require(slotIndex <= MAX_SLOT_INDEX, "Slot index out of bounds.");
        if (slotIndex == 516 && numberIndex == 3) {
            return 999999;
        }

        uint256 position = numberIndex * 6; // calculate the position for slicing the entropy value
        require(position <= 72, "Position calculation error");

        uint256 slotValue = entropySlots[slotIndex]; // slice the required [art of the entropy value
        uint256 entropy = (slotValue / (10 ** (72 - position))) % 1000000; // adjust the entropy value based on the number of digits
        uint256 paddedEntropy = entropy * (10 ** (6 - numberOfDigits(entropy)));

        return paddedEntropy; // return the caculated entropy value
    }

    // public function to expose entropy calculation for a given slot and number index
    function getPublicEntropy(
        uint256 slotIndex,
        uint256 numberIndex
    ) public view returns (uint256) {
        return getEntropy(slotIndex, numberIndex);
    }

    // Utility function te calcualte the number of digits in a number
    function numberOfDigits(uint256 number) private pure returns (uint256) {
        uint256 digits = 0;
        while (number != 0) {
            number /= 10;
            digits++;
        }
        return digits;
    }

    // utility to get he first digit of a number
    function getFirstDigit(uint256 number) private pure returns (uint256) {
        while (number >= 10) {
            number /= 10;
        }
        return number;
    }

    // function to get the last initialized index for debugging or informational puroposed
    function getLastInitializedIndex() public view returns (uint256) {
        return lastInitializedIndex;
    }

    // function to derive various parameters baed on entrtopy values, demonstrating potential cases
    function deriveTokenParameters(
        uint256 slotIndex,
        uint256 numberIndex
    )
        public
        view
        returns (
            uint256 nukeFactor,
            uint256 breedPotential,
            uint256 performanceFactor,
            bool isSire
        )
    {
        uint256 entropy = getEntropy(slotIndex, numberIndex);

        // example calcualtions using entropyto derive game-related parameters
        nukeFactor = entropy / 4000000;
        breedPotential = getFirstDigit(entropy);
        performanceFactor = entropy % 10;

        // exmaple logic to determine a boolean property based on entropy
        uint256 gender = entropy % 3;
        isSire = gender == 0;

        return (nukeFactor, breedPotential, performanceFactor, isSire); // return derived parammeters
    }
}
