# Conventions

## Frontend
- **Components**: Functional components with Tailwind CSS utility classes.
- **State**: React Context for global state, React Query for server state.
- **Icons**: Lucide React for consistent iconography.
- **Styling**: Shadcn-style utility usage (cva, tailwind-merge).

## Backend (Motoko)
- **Persistence**: Using `persistent actor` pattern (requires verification of specific Motoko version/features used, e.g., the use of `transient` and `persistent` keywords).
- **Naming**: camelCase for function names and types.
- **Safety**: Permission checks at the start of every public shared function.

## General
- **Naming**: "Akash" project name, "icp-project" in package.json.
- **Git**: Branching and commit conventions not yet observed.
