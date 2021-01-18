pragma solidity ^0.7.0;

library RArrAddress {
    /// @dev this DOES NOT preserve order
    function removeInd(address[] storage arr, uint256 ind) internal {
        require(
            0 <= ind && ind < arr.length,
            "The index must be within range of the list"
        );
        uint256 lastElemInd = arr.length - 1;
        arr[ind] = arr[lastElemInd];
        arr.pop();
    }
}
