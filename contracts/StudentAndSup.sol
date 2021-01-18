pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utils/RArrAddress.sol";

/// @dev the contract for the interaction between the student and supervisor
contract StudentAndSup is Ownable {
    using SafeMath for uint256;
    using SafeMath for uint256;
    using RArrAddress for address[];

    ///@dev all initialized students
    address[] private students;

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
        // TODO: add student to potential student array
    }

    function potentialSupApproveStudent(address student) external {
        initStudent(student);
    }

    /// @dev msg.sender is the student
    function initStudent(address student) private {
        require(
            studentToSupervisor[student] == address(0),
            "Student cannot already have a supervisor"
        );
        require(
            potentialStudentToApprovedSup[student] == msg.sender,
            "Student must have approved this supervisor"
        );

        studentToSupervisor[student] = msg.sender;
        supervisorNumbStudents[msg.sender]++;
        students.push(student);
        // TODO: delete student from potential student array
        delete potentialStudentToApprovedSup[student];
    }

    function getSupsStudents(address supervisor)
        external
        view
        returns (address[] memory)
    {
        address[] memory supsStudents =
            new address[](supervisorNumbStudents[supervisor]);
        uint256 counter = 0;
        for (uint256 i = 0; i < students.length; i = i.add(1)) {
            if (studentToSupervisor[students[i]] == supervisor) {
                supsStudents[counter] = students[i];
                counter = counter.add(1);
            }
        }
        return supsStudents;
    }

    function getSupsPotentialStudents(address supervisor)
        external
        view
        returns (address[] memory)
    {
      // TODO: implement me! Also add mapping for # of potential students
    }
}
