import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ApprovalStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface Exam {
  'id' : bigint,
  'marks' : Array<ExamMarks>,
  'subject' : string,
  'examDate' : Time,
}
export interface ExamMarks {
  'marks' : bigint,
  'studentId' : bigint,
  'grade' : Grade,
}
export type Grade = { 'a' : null } |
  { 'b' : null } |
  { 'c' : null } |
  { 'd' : null } |
  { 'f' : null };
export interface Student {
  'id' : bigint,
  'status' : ApprovalStatus,
  'fullName' : string,
  'userPrincipal' : [] | [Principal],
  'contactNumber' : string,
  'classAssignment' : string,
  'registrationTime' : Time,
  'guardianName' : string,
}
export interface Teacher {
  'id' : bigint,
  'status' : ApprovalStatus,
  'subjects' : Array<string>,
  'fullName' : string,
  'classes' : Array<string>,
  'userPrincipal' : [] | [Principal],
  'contactNumber' : string,
  'registrationTime' : Time,
}
export type Time = bigint;
export interface UserApprovalInfo {
  'status' : ApprovalStatus,
  'principal' : Principal,
}
export interface UserProfile {
  'userType' : string,
  'name' : string,
  'entityId' : [] | [bigint],
}
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'addExam' : ActorMethod<[string, Time], undefined>,
  'approveStudent' : ActorMethod<[bigint, ApprovalStatus], undefined>,
  'approveTeacher' : ActorMethod<[bigint, ApprovalStatus], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'getAllApprovedStudents' : ActorMethod<[], Array<Student>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getExam' : ActorMethod<[bigint], [] | [Exam]>,
  'getMyStudentId' : ActorMethod<[], [] | [bigint]>,
  'getMyTeacherId' : ActorMethod<[], [] | [bigint]>,
  'getStudentById' : ActorMethod<[bigint], [] | [Student]>,
  'getTeacherById' : ActorMethod<[bigint], [] | [Teacher]>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isCallerApproved' : ActorMethod<[], boolean>,
  'isStudentApproved' : ActorMethod<[bigint], boolean>,
  'listApprovals' : ActorMethod<[], Array<UserApprovalInfo>>,
  'registerStudent' : ActorMethod<[string, string, string, string], undefined>,
  'registerTeacher' : ActorMethod<
    [string, string, Array<string>, Array<string>],
    undefined
  >,
  'requestApproval' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setApproval' : ActorMethod<[Principal, ApprovalStatus], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
