# Testing

## Automated Tests
- No automated tests (Vitest, Jest, Playwright) detected in `package.json`.
- No `tests/` directory found.

## Manual Verification
- **Development Server**: `npm run dev`
- **ICP Local Deployment**: `dfx start`, `dfx deploy`
- **Dashboard Verification**: Manual login and navigation through Admin, Teacher, and Student roles.

## Areas for Improvement
- Lack of unit tests for Motoko modules.
- Lack of e2e tests for core workflows (registration -> approval -> dashboard access).
