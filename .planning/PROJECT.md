# School Management System (SMS)

## What This Is
A comprehensive school management platform with role-based access control supporting three user types: Admin (Principal), Teacher, and Student. It enables decentralized management of student admissions, teacher assignments, attendance, exams, and school notices.

## Core Value
Provides a secure, role-based single source of truth for all school administrative and academic operations on the Internet Computer.

## Requirements

### Validated
- ✓ **Role-Based Login**: Secure session tokens with Admin, Teacher, Student roles.
- ✓ **User Management**: Basic profile management for all roles.
- ✓ **Registration Workflow**: Student and Teacher registration logic in Motoko.
- ✓ **Access Control**: Role-specific permissions enforced at the canister level.
- ✓ **Notice Management**: Admin-created notices visible across dashboards.

### Active
- [ ] **Attendance Tracking**: Daily attendance marking by teachers for assigned classes.
- [ ] **Exam Management**: Scheduling and marks entry for subjects.
- [ ] **Result Calculation**: Automated grade assignment based on marks.
- [ ] **Comprehensive Reports**: Attendance and result history for students and admins.

### Out of Scope
- **Real-time Video Lectures**: High bandwidth/complexity, deferred to future milestones.
- **Financial Management (Fees)**: Not in initial scope, focused on academic/admin records first.

## Context
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, Motoko (ICP), Supabase (Auth/Assets).
- **Environment**: Developed for deployment on the Internet Computer (ICP).
- **Existing Code**: Robust Motoko backend with `AccessControl` and `UserApproval` modules.

## Constraints
- **Tech Stack**: Must use Internet Computer (ICP) for core state to ensure decentralization.
- **Security**: Must adhere to strict role-based data isolation.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ICP + Supabase Hybrid | Leverage ICP for logic/state and Supabase for auxiliary services/auth. | — Pending |
| Persistent Actor Pattern | Ensure data survives canister upgrades on ICP. | ✓ Good |

---
*Last updated: 2026-03-25 after initialization*
