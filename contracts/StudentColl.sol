pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./StudentAndSup.sol";
import "./utils/RArrUint256.sol";

contract StudentColl is ERC721, Ownable, StudentAndSup {
    using SafeMath for uint256;
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    using RArrUint256 for uint256[];

    Counters.Counter private _tokenIds;

    mapping(address => uint256[]) internal pendingCollectibleIds;

    /// @dev the clock in time for an account on a given day
    mapping(address => uint256) public clock_in_times;

    /// @dev check the last clock out day for working. Used to ensure that only one clock out is done per day
    mapping(address => uint16) private last_clock_in_day;

    modifier _once_per_day() {
        require(
            uint16(block.timestamp.div(1 days)) > last_clock_in_day[msg.sender]
        );
        _;
    }

    event PayoutMadeMultEvent(address indexed _to, uint256 numbToks);
    event PayoutMadeEvent(address indexed _to, uint256 tokId);
    event ClockInTimeEvent(address indexed user, uint256 timestamp);
    event ClockOutTimeEvent(address indexed user, uint256 timestamp, bool newPendingTok);

    constructor() ERC721("StudentColl", "STU") StudentAndSup() {
        transferOwnership(msg.sender);
    }

    function getPendingCollectibles(address student)
        external
        view
        returns (uint256[] memory)
    {
        return pendingCollectibleIds[student];
    }

    /// @dev a user clocks in their start time
    function clockStartTime() public _once_per_day _is_student {
        clock_in_times[msg.sender] = block.timestamp;
        last_clock_in_day[msg.sender] = uint16(block.timestamp.div(1 days));
        emit ClockInTimeEvent(msg.sender, block.timestamp);
    }

    // Not exact, it is off by a few minutes?
    function clockEndTime() public _is_student {
        uint256 end_time = block.timestamp;
        require(end_time >= clock_in_times[msg.sender]);
        bool newPendingTok = false;
        if (end_time.sub(clock_in_times[msg.sender]) <= 1 hours) {
            // Payout one full coin
            newPendingTok = true;
            _payout(msg.sender);
        }
        emit ClockOutTimeEvent(msg.sender, block.timestamp, newPendingTok);
    }

    function _payout(address _to) private _is_student {
        _tokenIds.increment();
        uint256 newTokId = _tokenIds.current();
        pendingCollectibleIds[_to].push(newTokId);
    }

    function removeFromPending(address student, uint256 tokInd) internal {
        require(
            0 <= tokInd && tokInd < pendingCollectibleIds[student].length,
            "The token index must be within range of the student's pending ids array"
        );
        pendingCollectibleIds[student].removeInd(tokInd);
    }
}
