pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


// TODO: add an event emit for start time which is listened to on the front end. 
// TODO: find way to incroperate an oracle

contract EvieCoin is ERC20, Ownable {
    using SafeMath for uint256;
    using SafeMath for uint;

    /// @dev the clock in time for an account on a given day
    mapping (address => uint) private clock_in_times;

    /// @dev check the last clock out day for working. Used to ensure that only one clock out is done per day
    mapping (address => uint16) private last_clock_in_day;

    event PayoutMadeEvent(address _to, uint value);
    event ClockInTimeEvent(address user, uint timestamp);
    event ClockOutTimeEvent(address user, uint timestamp);

    constructor(uint256 initialSupply) ERC20("EvieCOIN", "EVE") {
        transferOwnership(msg.sender);
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }

    modifier _once_per_day() {
        require(uint16(block.timestamp.div(1 days)) >  last_clock_in_day[msg.sender]);
        _;
    }

    /// @dev a user clocks in their start time
    function clockStartTime() public _once_per_day {
        clock_in_times[msg.sender] = block.timestamp;
        last_clock_in_day[msg.sender] = uint16(block.timestamp.div(1 days));
        clock_in_times[msg.sender];
        emit ClockInTimeEvent(msg.sender, block.timestamp);
    }

    // Not exact, it is off by a few minutes?
    function clockEndTime() public {
        uint end_time = block.timestamp;
        require(end_time >= clock_in_times[msg.sender]);
        if (end_time.sub(clock_in_times[msg.sender]) <= 1 hours) {
            // Payout one full coin
            _payout(msg.sender, 1 * (10 ** decimals()));
        }
        emit ClockInTimeEvent(msg.sender, block.timestamp);
    }

    function mint_new(uint amount) public onlyOwner {
        _mint(owner(), amount);
    }

    function _payout(address _to, uint reward_val) private {
        _transfer(owner(), _to, reward_val);
        emit PayoutMadeEvent(_to, reward_val);
    }
}
