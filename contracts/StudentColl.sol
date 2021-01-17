pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract StudentColl is ERC721, Ownable {
    using SafeMath for uint256;
    using SafeMath for uint256;
    using Counters for Counters.Counter;
        
    Counters.Counter private _tokenIds;


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

    event PayoutMadeEvent(address indexed _to, uint256 tokId);
    event ClockInTimeEvent(address indexed user, uint256 timestamp);
    event ClockOutTimeEvent(address indexed user, uint256 timestamp);

    constructor() ERC721("StudentColl", "STU") {
        transferOwnership(msg.sender);
    }

    /// @dev a user clocks in their start time
    function clockStartTime() public _once_per_day {
        clock_in_times[msg.sender] = block.timestamp;
        last_clock_in_day[msg.sender] = uint16(block.timestamp.div(1 days));
        emit ClockInTimeEvent(msg.sender, block.timestamp);
    }

    // Not exact, it is off by a few minutes?
    function clockEndTime() public {
        uint256 end_time = block.timestamp;
        require(end_time >= clock_in_times[msg.sender]);
        if (end_time.sub(clock_in_times[msg.sender]) <= 1 hours) {
            // Payout one full coin
            _payout(msg.sender);
        }
        emit ClockOutTimeEvent(msg.sender, block.timestamp);
    }

    function _payout(address _to) private {
        _tokenIds.increment();
        uint256 newTokId = _tokenIds.current();
        _safeMint(_to, newTokId);
        emit PayoutMadeEvent(_to, newTokId);
    }
}
