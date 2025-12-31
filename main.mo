import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import List "mo:core/List";
import Option "mo:core/Option";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import Char "mo:core/Char";
import Nat32 "mo:core/Nat32";

actor {
  type Role = AccessControl.UserRole;
  type ApprovalStatus = UserApproval.ApprovalStatus;

  module TimeCompare {
    public func compare(t1 : Time.Time, t2 : Time.Time) : Order.Order {
      compareValues(t1, t2);
    };

    private func compareValues(t1 : Time.Time, t2 : Time.Time) : Order.Order {
      if (t1 < t2) { #less } else if (t1 > t2) { #greater } else { #equal };
    };
  };

  module Grade {
    public type Grade = {
      #a;
      #b;
      #c;
      #d;
      #f;
    };

    public func fromMark(mark : Nat) : Grade {
      if (mark >= 90) { #a } else if (mark >= 75) {
        #b;
      } else if (mark >= 60) {
        #c;
      } else if (mark >= 50) {
        #d;
      } else { #f };
    };
  };

  module Student {
    public type Student = {
      id : Nat;
      fullName : Text;
      guardianName : Text;
      contactNumber : Text;
      classAssignment : Text;
      status : ApprovalStatus;
      registrationTime : Time.Time;
      userPrincipal : ?Principal;
    };
  };

  module Teacher {
    public type Teacher = {
      id : Nat;
      fullName : Text;
      contactNumber : Text;
      subjects : [Text];
      classes : [Text];
      status : ApprovalStatus;
      registrationTime : Time.Time;
      userPrincipal : ?Principal;
    };
  };

  module ExamMarks {
    public type Exam = {
      id : Nat;
      subject : Text;
      examDate : Time.Time;
      marks : [(Nat, ExamMarks)];
    };

    public type ExamMarks = {
      studentId : Nat;
      marks : Nat;
      grade : Grade.Grade;
    };
  };

  public type UserProfile = {
    name : Text;
    userType : Text;
    entityId : ?Nat;
  };

  let students = Map.empty<Nat, Student.Student>();
  let teachers = Map.empty<Nat, Teacher.Teacher>();
  let exams = Map.empty<Nat, ExamMarks.Exam>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToStudentId = Map.empty<Principal, Nat>();
  let principalToTeacherId = Map.empty<Principal, Nat>();

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  var studentIdCounter = 0;
  var teacherIdCounter = 0;
  var examIdCounter = 0;

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerStudent(fullName : Text, guardianName : Text, contactNumber : Text, classAssignment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    studentIdCounter += 1;
    let newStudent : Student.Student = {
      id = studentIdCounter;
      fullName;
      guardianName;
      contactNumber;
      classAssignment;
      status = #pending;
      registrationTime = Time.now();
      userPrincipal = ?caller;
    };

    students.add(studentIdCounter, newStudent);
    principalToStudentId.add(caller, studentIdCounter);
  };

  public shared ({ caller }) func registerTeacher(fullName : Text, contactNumber : Text, subjects : [Text], classes : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can register teachers");
    };

    teacherIdCounter += 1;
    let newTeacher : Teacher.Teacher = {
      id = teacherIdCounter;
      fullName;
      contactNumber;
      subjects;
      classes;
      status = #pending;
      registrationTime = Time.now();
      userPrincipal = null;
    };

    teachers.add(teacherIdCounter, newTeacher);
  };

  public shared ({ caller }) func approveStudent(studentId : Nat, status : ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve students");
    };

    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent : Student.Student = {
          id = student.id;
          fullName = student.fullName;
          guardianName = student.guardianName;
          contactNumber = student.contactNumber;
          classAssignment = student.classAssignment;
          status;
          registrationTime = student.registrationTime;
          userPrincipal = student.userPrincipal;
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  public shared ({ caller }) func approveTeacher(teacherId : Nat, status : ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve teachers");
    };

    switch (teachers.get(teacherId)) {
      case (null) { Runtime.trap("Teacher not found") };
      case (?teacher) {
        let updatedTeacher : Teacher.Teacher = {
          id = teacher.id;
          fullName = teacher.fullName;
          contactNumber = teacher.contactNumber;
          subjects = teacher.subjects;
          classes = teacher.classes;
          status;
          registrationTime = teacher.registrationTime;
          userPrincipal = teacher.userPrincipal;
        };
        teachers.add(teacherId, updatedTeacher);
      };
    };
  };

  public shared ({ caller }) func addExam(subject : Text, examDate : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add exams");
    };

    examIdCounter += 1;
    let newExam : ExamMarks.Exam = {
      id = examIdCounter;
      subject;
      examDate;
      marks = [];
    };

    exams.add(examIdCounter, newExam);
  };

  public query ({ caller }) func isStudentApproved(studentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check approval status");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerStudentId = principalToStudentId.get(caller);

    if (not isAdmin) {
      switch (callerStudentId) {
        case (?id) {
          if (id != studentId) {
            Runtime.trap("Unauthorized: Students can only check their own approval status");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: Only admins and the student can check approval status");
        };
      };
    };

    switch (students.get(studentId)) {
      case (null) { false };
      case (?student) { student.status == #approved };
    };
  };

  public query ({ caller }) func getAllApprovedStudents() : async [Student.Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view students");
    };

    students.values().toArray().filter(
      func(student) {
        student.status == #approved;
      }
    );
  };

  public query ({ caller }) func getTeacherById(teacherId : Nat) : async ?Teacher.Teacher {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view teachers");
    };

    teachers.get(teacherId);
  };

  public query ({ caller }) func getExam(examId : Nat) : async ?ExamMarks.Exam {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view exams");
    };

    exams.get(examId);
  };

  public query ({ caller }) func getStudentById(studentId : Nat) : async ?Student.Student {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view student details");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerStudentId = principalToStudentId.get(caller);

    if (not isAdmin) {
      switch (callerStudentId) {
        case (?id) {
          if (id != studentId) {
            Runtime.trap("Unauthorized: Students can only view their own details");
          };
        };
        case (null) {
          // Caller is a teacher - allowed to view student info (read-only)
        };
      };
    };

    students.get(studentId);
  };

  public query ({ caller }) func getMyStudentId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access this");
    };

    principalToStudentId.get(caller);
  };

  public query ({ caller }) func getMyTeacherId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access this");
    };

    principalToTeacherId.get(caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : ApprovalStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};
