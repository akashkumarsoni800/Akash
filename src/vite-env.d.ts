/// <reference types="vite/client" />

// Add only the VITE_* keys your app actually uses.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // add other VITE_ variables here as needed, e.g.:
  // readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
