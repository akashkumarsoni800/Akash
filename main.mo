import Time "mo:base/Time";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Order "mo:base/Order";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug"; 

import AccessControl "access-control";
import UserApproval "approval";

// FINAL FIX: Yahan 'persistent' wapas lagaya hai
persistent actor { 

  // --- HELPER FUNCTIONS ---
  func natHash(n : Nat) : Nat32 {
    let mod = n % 4_294_967_296; 
    Nat32.fromNat(mod)
  };

  // --- TYPE DEFINITIONS ---
  type Role = AccessControl.UserRole;
  type ApprovalStatus = UserApproval.ApprovalStatus;

  module TimeCompare {
    public func compare(t1 : Time.Time, t2 : Time.Time) : Order.Order {
      if (t1 < t2) { #less } else if (t1 > t2) { #greater } else { #equal };
    };
  };

  module Grade {
    public type Grade = { #a; #b; #c; #d; #f };

    public func fromMark(mark : Nat) : Grade {
      if (mark >= 90) { #a } 
      else if (mark >= 75) { #b } 
      else if (mark >= 60) { #c } 
      else if (mark >= 50) { #d } 
      else { #f };
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
    public type ExamMarks = {
      studentId : Nat;
      marks : Nat;
      grade : Grade.Grade;
    };

    public type Exam = {
      id : Nat;
      subject : Text;
      examDate : Time.Time;
      marks : [ExamMarks]; 
    };
  };

  public type UserProfile = {
    name : Text;
    userType : Text;
    entityId : ?Nat;
  };

  // --- STATE VARIABLES ---
  // FINAL FIX: Yahan 'transient' wapas lagaya hai
  
  transient let students = HashMap.HashMap<Nat, Student.Student>(0, Nat.equal, natHash);
  transient let teachers = HashMap.HashMap<Nat, Teacher.Teacher>(0, Nat.equal, natHash);
  transient let exams = HashMap.HashMap<Nat, ExamMarks.Exam>(0, Nat.equal, natHash);
  
  transient let userProfiles = HashMap.HashMap<Principal, UserProfile>(0, Principal.equal, Principal.hash);
  transient let principalToStudentId = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);
  transient let principalToTeacherId = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);

  transient let accessControlState = AccessControl.initState();
  transient let approvalState = UserApproval.initState(accessControlState);

  transient var studentIdCounter = 0;
  transient var teacherIdCounter = 0;
  transient var examIdCounter = 0;

  // --- FUNCTIONS ---

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
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.put(caller, profile);
  };

  public shared ({ caller }) func registerStudent(fullName : Text, guardianName : Text, contactNumber : Text, classAssignment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can register");
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

    students.put(studentIdCounter, newStudent);
    principalToStudentId.put(caller, studentIdCounter);
  };

  public shared ({ caller }) func registerTeacher(fullName : Text, contactNumber : Text, subjects : [Text], classes : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can register teachers");
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

    teachers.put(teacherIdCounter, newTeacher);
  };

  public shared ({ caller }) func approveStudent(studentId : Nat, status : ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can approve students");
    };

    switch (students.get(studentId)) {
      case (null) { Debug.trap("Student not found") };
      case (?student) {
        let updatedStudent : Student.Student = {
          id = student.id;
          fullName = student.fullName;
          guardianName = student.guardianName;
          contactNumber = student.contactNumber;
          classAssignment = student.classAssignment;
          status = status;
          registrationTime = student.registrationTime;
          userPrincipal = student.userPrincipal;
        };
        students.put(studentId, updatedStudent);
      };
    };
  };

  public shared ({ caller }) func approveTeacher(teacherId : Nat, status : ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can approve teachers");
    };

    switch (teachers.get(teacherId)) {
      case (null) { Debug.trap("Teacher not found") };
      case (?teacher) {
        let updatedTeacher : Teacher.Teacher = {
          id = teacher.id;
          fullName = teacher.fullName;
          contactNumber = teacher.contactNumber;
          subjects = teacher.subjects;
          classes = teacher.classes;
          status = status;
          registrationTime = teacher.registrationTime;
          userPrincipal = teacher.userPrincipal;
        };
        teachers.put(teacherId, updatedTeacher);
      };
    };
  };

  public shared ({ caller }) func addExam(subject : Text, examDate : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add exams");
    };

    examIdCounter += 1;
    let newExam : ExamMarks.Exam = {
      id = examIdCounter;
      subject;
      examDate;
      marks = [];
    };

    exams.put(examIdCounter, newExam);
  };

  public query ({ caller }) func isStudentApproved(studentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can check approval status");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerStudentId = principalToStudentId.get(caller);

    if (not isAdmin) {
      switch (callerStudentId) {
        case (?id) {
          if (id != studentId) {
            Debug.trap("Unauthorized: Students can only check their own approval status");
          };
        };
        case (null) {
          Debug.trap("Unauthorized: Only admins and the student can check approval status");
        };
      };
    };

    switch (students.get(studentId)) {
      case (null) { false };
      case (?student) { 
        switch(student.status) {
            case(#approved) { true };
            case(_) { false };
        }
      };
    };
  };

  public query ({ caller }) func getAllApprovedStudents() : async [Student.Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view students");
    };

    let buff = Buffer.Buffer<Student.Student>(0);
    for (student in students.vals()) {
      switch (student.status) {
        case (#approved) { buff.add(student) };
        case (_) {};
      };
    };
    Buffer.toArray(buff);
  };

  public query ({ caller }) func getTeacherById(teacherId : Nat) : async ?Teacher.Teacher {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view teachers");
    };
    teachers.get(teacherId);
  };

  public query ({ caller }) func getExam(examId : Nat) : async ?ExamMarks.Exam {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view exams");
    };
    exams.get(examId);
  };

  public query ({ caller }) func getStudentById(studentId : Nat) : async ?Student.Student {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view student details");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerStudentId = principalToStudentId.get(caller);

    if (not isAdmin) {
      switch (callerStudentId) {
        case (?id) {
          if (id != studentId) {
            Debug.trap("Unauthorized: Students can only view their own details");
          };
        };
        case (null) {
        };
      };
    };

    students.get(studentId);
  };

  public query ({ caller }) func getMyStudentId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can access this");
    };
    principalToStudentId.get(caller);
  };

  public query ({ caller }) func getMyTeacherId() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can access this");
    };
    principalToTeacherId.get(caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    if (isAdmin) {
        true
    } else {
        UserApproval.isApproved(approvalState, caller)
    }
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : ApprovalStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};