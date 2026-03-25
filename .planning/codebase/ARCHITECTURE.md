# Architecture

## Overview
A decentralized hybrid application consisting of a React-based web frontend and a Motoko-based smart contract backend running on the Internet Computer, supplemented by Supabase for external services.

## System Boundaries
1. **Frontend (Client)**: Single Page Application (SPA) built with React/Vite.
2. **Backend (Canister)**: Motoko actor managing core business logic (students, teachers, exams, attendance, notices).
3. **Database (Hybrid)**: 
    - ICP Canister state (HashMaps for students, teachers, etc.)
    - Supabase (Usage needs confirmation, possibly for file storage or fallback DB).

## Role-Based Access Control (RBAC)
- Enforced at the Canister level via `access-control.mo`.
- Roles: `Principal` (Admin), `Teacher`, `Student`.
- Frontend hides/shows features based on the role returned by the backend.

## Data Flow
1. User authenticates (Identity Service).
2. Frontend calls Motoko public functions (Query/Update).
3. Canister validates permissions and updates state.
4. Frontend updates UI based on backend response.
