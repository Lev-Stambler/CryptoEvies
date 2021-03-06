pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./StudentColl.sol";

/// @dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour
/// A supervisor can then approve the coin
contract EvieCoin is StudentColl {
    using SafeMath for uint256;
    using SafeMath for uint256;

    constructor() StudentColl() {}

    function SupervisorApproveAll(address student) external {
        for (uint256 i = 0; i < pendingCollectibleIds[student].length; i++) {
            _supervisorApprove(student, i);
        }
        emit PayoutMadeMultEvent(
            student,
            pendingCollectibleIds[student].length
        );
        delete pendingCollectibleIds[student];
    }

    function SupervisorApprove(address student, uint256 tokInd) public {
        _supervisorApprove(student, tokInd);
        removeFromPending(student, tokInd);
        emit PayoutMadeEvent(student, tokInd);
    }

    function _supervisorApprove(address student, uint256 tokInd) internal {
        uint256 tokId = pendingCollectibleIds[student][tokInd];
        _safeMint(student, tokId);
    }
}
