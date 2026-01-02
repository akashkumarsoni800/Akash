export const idlFactory = ({ IDL }) => {
  const Time = IDL.Int;
  const ApprovalStatus = IDL.Variant({
    'pending' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Student = IDL.Record({
    'id' : IDL.Nat,
    'status' : ApprovalStatus,
    'fullName' : IDL.Text,
    'userPrincipal' : IDL.Opt(IDL.Principal),
    'contactNumber' : IDL.Text,
    'classAssignment' : IDL.Text,
    'registrationTime' : Time,
    'guardianName' : IDL.Text,
  });
  const UserProfile = IDL.Record({
    'userType' : IDL.Text,
    'name' : IDL.Text,
    'entityId' : IDL.Opt(IDL.Nat),
  });
  const Grade = IDL.Variant({
    'a' : IDL.Null,
    'b' : IDL.Null,
    'c' : IDL.Null,
    'd' : IDL.Null,
    'f' : IDL.Null,
  });
  const ExamMarks = IDL.Record({
    'marks' : IDL.Nat,
    'studentId' : IDL.Nat,
    'grade' : Grade,
  });
  const Exam = IDL.Record({
    'id' : IDL.Nat,
    'marks' : IDL.Vec(ExamMarks),
    'subject' : IDL.Text,
    'examDate' : Time,
  });
  const Teacher = IDL.Record({
    'id' : IDL.Nat,
    'status' : ApprovalStatus,
    'subjects' : IDL.Vec(IDL.Text),
    'fullName' : IDL.Text,
    'classes' : IDL.Vec(IDL.Text),
    'userPrincipal' : IDL.Opt(IDL.Principal),
    'contactNumber' : IDL.Text,
    'registrationTime' : Time,
  });
  const UserApprovalInfo = IDL.Record({
    'status' : ApprovalStatus,
    'principal' : IDL.Principal,
  });
  return IDL.Service({
    'addExam' : IDL.Func([IDL.Text, Time], [], []),
    'approveStudent' : IDL.Func([IDL.Nat, ApprovalStatus], [], []),
    'approveTeacher' : IDL.Func([IDL.Nat, ApprovalStatus], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'getAllApprovedStudents' : IDL.Func([], [IDL.Vec(Student)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getExam' : IDL.Func([IDL.Nat], [IDL.Opt(Exam)], ['query']),
    'getMyStudentId' : IDL.Func([], [IDL.Opt(IDL.Nat)], ['query']),
    'getMyTeacherId' : IDL.Func([], [IDL.Opt(IDL.Nat)], ['query']),
    'getStudentById' : IDL.Func([IDL.Nat], [IDL.Opt(Student)], ['query']),
    'getTeacherById' : IDL.Func([IDL.Nat], [IDL.Opt(Teacher)], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'isCallerApproved' : IDL.Func([], [IDL.Bool], ['query']),
    'isStudentApproved' : IDL.Func([IDL.Nat], [IDL.Bool], ['query']),
    'listApprovals' : IDL.Func([], [IDL.Vec(UserApprovalInfo)], ['query']),
    'registerStudent' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [],
        [],
      ),
    'registerTeacher' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)],
        [],
        [],
      ),
    'requestApproval' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setApproval' : IDL.Func([IDL.Principal, ApprovalStatus], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
