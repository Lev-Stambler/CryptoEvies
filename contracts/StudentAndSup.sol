pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utils/RArrAddress.sol";

/// @dev the contract for the interaction between the student and supervisor
contract StudentAndSup is Ownable {
    using SafeMath for uint256;
    using SafeMath for uint256;
    using RArrAddress for address[];

    enum StudentType {
        FullStudent,
        PendingStudent,
        None
    }

    event StudentStatusChange(address indexed sup, address indexed student);

    ///@dev all initialized students
    address[] private students;

    ///@dev all pending students
    address[] private pendingStudents;

    ///@dev a mapping of potential students to potential supervisors who they approved
    mapping(address => address) private pendingStudentToApprovedSup;

    ///@dev all initialized students mapped to their supervisor.
    mapping(address => address) private studentToSupervisor;

    /// @dev check if an address is a student by checking if the address has a supervisor
    modifier _is_student() {
        require(studentToSupervisor[msg.sender] != address(0));
        _;
    }

    modifier _is_not_pending() {
        for (uint256 i = 0; i < pendingStudents.length; i++) {
            if (pendingStudents[i] == msg.sender) {
                require(false, "Student must not be a pending student");
            }
        }
        _;
    }

    modifier _is_not_student() {
        for (uint i = 0; i < students.length; i++) {
            if (students[i] == msg.sender) {
                require(false, "Sender cannot be a student");
            }   
        }
        _;
    }

    constructor() {}

    /// @dev get whether the student is a pending potential student, initialized, or nothing at all 
    function studentStatus(address student) view public returns(StudentType) {
        if (studentToSupervisor[student] != address(0)) {
            return StudentType.FullStudent;
        } else if (pendingStudentToApprovedSup[student] != address(0)) {
            return StudentType.PendingStudent;
        } else {
            return StudentType.None;
        }
    }

    /// @param supervisor - The student's desired supervisor
    /// @dev msg.sender is the student's address
    function createPotentialStudent(address supervisor)
        external
        _is_not_pending
        _is_not_student
    {
        require(
            studentToSupervisor[msg.sender] == address(0),
            "Student cannot already have a supervisor"
        );
        pendingStudentToApprovedSup[msg.sender] = supervisor;
        pendingStudents.push(msg.sender);
        emit StudentStatusChange(supervisor, msg.sender);
    }

    function potentialSupApproveStudent(uint256 pendingStudentInd) external {
        initStudent(pendingStudentInd);
    }

    /// @dev msg.sender is the supervisor
    function initStudent(uint256 pendingStudentInd) private {
        address student = pendingStudents[pendingStudentInd];
        require(
            studentToSupervisor[student] == address(0),
            "Student cannot already have a supervisor"
        );
        require(
            pendingStudentToApprovedSup[student] == msg.sender,
            "Student must have set this supervisor"
        );

        studentToSupervisor[student] = msg.sender;
        students.push(student);
        pendingStudents.removeInd(pendingStudentInd);
        delete pendingStudentToApprovedSup[student];
        emit StudentStatusChange(msg.sender, student);
    }

    function getSupsStudents()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        return getStudentsPerSup(students, studentToSupervisor, msg.sender);
    }


    /// @return the students' addresses, their index in the address array
    function getSupsPotentialStudents()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        return
            getStudentsPerSup(
                pendingStudents,
                pendingStudentToApprovedSup,
                msg.sender
            );
    }

    function getStudentsPerSup(
        address[] storage _students,
        mapping(address => address) storage _studentToSup,
        address supervisor
    ) private view returns (address[] memory, uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _students.length; i = i.add(1)) {
            address student = _students[i];
            if (_studentToSup[student] == supervisor) {
                count = count.add(1);
            }
        }
        address[] memory supsStudents = new address[](count);
        uint256[] memory supsStudentsInds = new uint256[](count);

        uint256 x = 0;
        for (uint256 i = 0; i < _students.length; i = i.add(1)) {
            address student = _students[i];
            if (_studentToSup[student] == supervisor) {
                supsStudents[x] = student;
                supsStudentsInds[x] = i;
                x = x.add(1);
                // TODO: test the following!
                // account for case where another student is added mid function call
                if (count <= x) {
                    return (supsStudents, supsStudentsInds);
                }
            }
        }
        return (supsStudents, supsStudentsInds);
    }
}
