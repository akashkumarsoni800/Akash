# Integrations

## Internet Computer (ICP)
- **Canisters**: `backend` (Motoko), `frontend` (Assets)
- **Auth**: Principal-based identity using `@dfinity/identity` and `@dfinity/agent`.
- **Modules**:
    - `AccessControl`: Manages roles (Admin, Teacher, Student).
    - `UserApproval`: Manages registration approval workflow.
- **Client**: `src/backend.ts` for interacting with ICP canisters.

## Supabase
- **Client**: `src/supabaseClient.ts`
- **Usage**: Likely for auth or data storage not handled by ICP canisters.

## Browser APIs
- **Webcam**: Used via `react-webcam`.
- **Image Compression**: Used via `browser-image-compression`.
