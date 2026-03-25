# Structure

## Directory Map
- `Akash/`
    - `src/`: Frontend Source
        - `components/`: Shared UI components (Dashboard, Sidebar, Layouts).
        - `pages/`: Main views (Login, StudentDashboard, AdminPanel).
        - `context/`: React Context providers (Auth, Theme).
        - `hooks/`: Custom hooks for data fetching and logic.
        - `declarations/`: Auto-generated Candid bindings for ICP.
        - `App.tsx`: Main router and layout wrapper.
        - `main.tsx`: React entry point.
    - `main.mo`: Core backend actor (Motoko).
    - `access-control.mo`: Role management logic.
    - `approval.mo`: User approval workflow logic.
    - `dfx.json`: DFX project configuration.
    - `package.json`: NPM dependencies and scripts.
    - `spec.md`: Project specification/requirements.
    - `dist/`: Build output for deployment.
