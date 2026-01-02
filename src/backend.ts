// src/backend.ts

// User Roles (Strictly defined as per Master Prompt Section 2)
export enum UserRole {
  admin = 'admin',      // Principal (Full Access)
  teacher = 'teacher',  // Academic Access
  student = 'student',  // Read-only Access
  guest = 'guest'       // Unregistered
}

// Student Approval Status (For Admission Module)
export enum ApprovalStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected'
}

// Gender Enum (Standardization)
export enum Gender {
  male = 'male',
  female = 'female',
  other = 'other'
}

// Class Sections (To maintain integrity)
export enum ClassSection {
  A = 'A',
  B = 'B',
  C = 'C'
}