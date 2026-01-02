// src/hooks/useQueries.ts
import { UserRole, ApprovalStatus } from '../backend';

// --- 1. AUTHENTICATION & PROFILE ---
export const useGetCallerUserProfile = () => {
  return { 
    data: { 
      userType: UserRole.admin, // Admin mode
      name: 'Principal Dinesh Prasad',
      email: 'principal@adarsh.com' 
    }, 
    isLoading: false, 
    isFetched: true 
  };
};

export const useGetCallerUserRole = () => {
  return { data: UserRole.admin, isLoading: false };
};

export const useSaveCallerUserProfile = () => {
  return { mutate: (data: any) => console.log("Saving Profile:", data) };
};

export const useInternetIdentity = () => {
  return { identity: true, isInitializing: false, login: () => {}, logout: () => {} };
};

// --- 2. ADMIN MODULES (Approvals) ---
export const useListApprovals = () => {
  return { 
    data: [
      { id: 1, name: "Rohan Kumar", class: "10th", status: ApprovalStatus.pending },
      { id: 2, name: "Sita Kumari", class: "9th", status: ApprovalStatus.pending }
    ], 
    isLoading: false 
  };
};

export const useApproveStudent = () => {
  return { mutate: (id: any) => console.log(`Student ${id} Approved`) };
};

export const useSetApproval = () => {
  return { mutate: (data: any) => console.log("Approval Status Updated:", data) };
};

export const useGetAllApprovedStudents = () => {
  return { 
    data: [
        { id: 1, name: "Student A", class: "10th", section: "A" }
    ], 
    isLoading: false 
  };
};

// --- 3. TEACHER MANAGEMENT MODULES ---
export const useRegisterTeacher = () => {
  return { mutate: (data: any) => console.log("Teacher Registered:", data) };
};

export const useGetAllTeachers = () => {
  return { 
    data: [
        { id: 101, name: "Amit Sir", subject: "Mathematics" },
        { id: 102, name: "Priya Mam", subject: "Science" }
    ], 
    isLoading: false 
  };
};

// --- 4. EXAM MODULES ---
export const useAddExam = () => {
  return { mutate: (data: any) => console.log("Exam Added:", data) };
};

export const useGetAllExams = () => {
  return { 
    data: [
        { id: 1, name: "Half Yearly", subject: "Maths", date: "2025-10-10" },
        { id: 2, name: "Finals", subject: "Science", date: "2026-03-15" }
    ], 
    isLoading: false 
  };
};

// --- 5. STUDENT MODULES ---
export const useRegisterStudent = () => {
  return { mutate: (data: any) => console.log("Student Registered:", data) };
};

export const useGetMyStudentId = () => {
  return { data: "STU-2024-001", isLoading: false };
};

export const useGetStudentById = (id: any) => {
  return { data: { name: "Rohan", class: "10", section: "A" }, isLoading: false };
};

export const useIsStudentApproved = () => {
  return { data: true, isLoading: false };
};

// --- 6. TEACHER SELF MODULES ---
export const useGetMyTeacherId = () => {
  return { data: "TCH-2024-001", isLoading: false };
};

export const useGetTeacherById = (id: any) => {
  return { data: { name: "Amit Sir", subject: "Maths" }, isLoading: false };
};