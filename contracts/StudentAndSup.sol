pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @dev the contract for the interaction between the student and supervisor
contract StudentAndSup is Ownable {
    using SafeMath for uint256;
    using SafeMath for uint256;

    ///@dev all initialized students
    address[] private allStudents;

    mapping(address => uint256) private supervisorNumbStudents;

    ///@dev a mapping of potential students to potential supervisors who they approved
    mapping(address => address) private potentialStudentToApprovedSup;

    ///@dev all initialized students mapped to their supervisor.
    mapping(address => address) private studentToSupervisor;

    /// @dev check if an address is a student by checking if the address has a supervisor
    modifier _is_student() {
        require(studentToSupervisor[msg.sender] != address(0));
        _;
    }

    constructor() {}

    function potentialStudentAllowSup(address supervisor) external {
        require(
            studentToSupervisor[msg.sender] == address(0),
            "Student cannot already have a supervisor"
        );
        potentialStudentToApprovedSup[msg.sender] = supervisor;
    }

    /// @dev msg.sender is the student
    function initStudent(address supervisor) external {
        require(
            studentToSupervisor[msg.sender] == address(0),
            "Student cannot already have a supervisor"
        );
        require(
            potentialStudentToApprovedSup[msg.sender] == supervisor,
            "Student must have approved this supervisor"
        );

        studentToSupervisor[msg.sender] = supervisor;
        supervisorNumbStudents[supervisor]++;
        allStudents.push(msg.sender);
        delete potentialStudentToApprovedSup[msg.sender];
    }

    function getSupsStudents(address supervisor)
        external
        view
        returns (address[] memory)
    {
        address[] memory students =
            new address[](supervisorNumbStudents[supervisor]);
        uint256 counter = 0;
        for (uint256 i = 0; i < allStudents.length; i = i.add(1)) {
            if (studentToSupervisor[allStudents[i]] == supervisor) {
                students[counter] = allStudents[i];
                counter = counter.add(1);
            }
        }
        return students;
    }
}
