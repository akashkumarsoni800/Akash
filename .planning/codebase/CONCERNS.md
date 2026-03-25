# Concerns

## Technical Risks
- **Hybrid State Persistence**: Synchronization between ICP canister state and Supabase state could lead to inconsistencies.
- **Persistence Model**: The use of `transient` keywords in `main.mo` suggests potential issues with state preservation across upgrades if not configured correctly.
- **Registration Complexity**: The multi-step registration (student signs up -> admin approves) is critical and lacks automated verification.

## Gaps
- **Missing Tests**: No automated test suite makes the project fragile to changes.
- **Documentation**: Missing TSDoc/JSDoc and Motoko comments in some areas.
- **Deployment**: `vercel.json` exists, suggesting a move away from pure ICP asset canisters for the frontend, or a multi-deployment strategy.

## Security
- Principal-based auth is robust, but the Role-Based Access Control logic in `main.mo` must be thoroughly audited.
