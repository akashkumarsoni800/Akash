# School Management System (SMS)

## Overview
A comprehensive school management platform with role-based access control supporting three user types: Admin (Principal), Teacher, and Student. Each role has dedicated dashboards with appropriate permissions and data access controls.

## Authentication & Authorization
- Role-based login system with secure session tokens
- Three user roles: Admin, Teacher, Student
- Access control middleware enforcing role-specific permissions
- Unauthorized access prevention across all features

## User Roles & Permissions

### Admin (Principal)
- Full system access with override capabilities
- Complete CRUD operations for all entities
- Approve/reject student registrations
- Assign teachers to classes and subjects
- Manage all attendance, exams, results, and notices
- View audit logs of all system modifications

### Teacher
- View assigned classes and subjects only
- Mark attendance for assigned classes
- Add and update exam marks for assigned subjects
- Read-only access to student information (except attendance/marks)
- View personal profile and school notices

### Student
- View personal profile, attendance, and exam results
- View assigned class and subjects
- View school notices
- Limited personal information editing (admin-controlled)

## Core Modules

### Student Management
- Student admission and profile management
- Guardian information storage
- Admin approval workflow for new registrations
- Class assignment and academic record tracking

### Teacher Management
- Teacher profile and contact information
- Subject and class assignment system
- Teaching schedule and workload management

### Attendance Management
- Daily attendance marking by teachers
- Class-wise attendance tracking
- Individual student attendance history
- Attendance reports and statistics

### Exam & Result Management
- Exam creation and scheduling
- Subject-wise marks entry by assigned teachers
- Result calculation and grade assignment
- Student result dashboards and reports

### Notice Management
- Admin-created notices with optional expiry dates
- Notice visibility across all user dashboards
- Notice categorization and priority levels

## Data Storage (Backend)
- Student records with personal and academic information
- Teacher profiles with assignment details
- Class and subject definitions
- Attendance records with date and status tracking
- Exam definitions and student marks
- Notice content with metadata and expiry
- User authentication credentials and role assignments
- Audit logs for admin override actions

## Backend Operations
- User authentication and session management
- Role-based data filtering and access control
- CRUD operations for all entities with permission validation
- Attendance marking and retrieval
- Exam marks entry and result calculation
- Notice publishing and retrieval
- Audit trail maintenance for data modifications

## User Interface
- Role-specific dashboards with relevant data and actions
- Responsive design for desktop and mobile access
- Clean, professional school-appropriate styling
- Intuitive navigation based on user permissions
- Fast-loading data tables and forms
- Error handling and validation feedback
