import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, Student, Teacher, Exam, UserApprovalInfo, ApprovalStatus, UserRole } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Student Queries
export function useRegisterStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      guardianName: string;
      contactNumber: string;
      classAssignment: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerStudent(
        data.fullName,
        data.guardianName,
        data.contactNumber,
        data.classAssignment
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStudentId'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useGetMyStudentId() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ['myStudentId'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyStudentId();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetStudentById(studentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Student | null>({
    queryKey: ['student', studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return null;
      return actor.getStudentById(studentId);
    },
    enabled: !!actor && !actorFetching && studentId !== null,
  });
}

export function useGetAllApprovedStudents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Student[]>({
    queryKey: ['students', 'approved'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllApprovedStudents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useApproveStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { studentId: bigint; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveStudent(data.studentId, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useIsStudentApproved(studentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['studentApproved', studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return false;
      return actor.isStudentApproved(studentId);
    },
    enabled: !!actor && !actorFetching && studentId !== null,
  });
}

// Teacher Queries
export function useRegisterTeacher() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      contactNumber: string;
      subjects: string[];
      classes: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerTeacher(
        data.fullName,
        data.contactNumber,
        data.subjects,
        data.classes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export function useGetMyTeacherId() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ['myTeacherId'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyTeacherId();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTeacherById(teacherId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Teacher | null>({
    queryKey: ['teacher', teacherId?.toString()],
    queryFn: async () => {
      if (!actor || !teacherId) return null;
      return actor.getTeacherById(teacherId);
    },
    enabled: !!actor && !actorFetching && teacherId !== null,
  });
}

export function useApproveTeacher() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { teacherId: bigint; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveTeacher(data.teacherId, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

// Exam Queries
export function useAddExam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { subject: string; examDate: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExam(data.subject, data.examDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useGetExam(examId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Exam | null>({
    queryKey: ['exam', examId?.toString()],
    queryFn: async () => {
      if (!actor || !examId) return null;
      return actor.getExam(examId);
    },
    enabled: !!actor && !actorFetching && examId !== null,
  });
}

// Approval Queries
export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(data.user, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(data.user, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
    },
  });
}
