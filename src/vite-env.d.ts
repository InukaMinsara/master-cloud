/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_STORAGE_BUCKET: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_DEFAULT_STORAGE_QUOTA_BYTES: string;
  readonly VITE_MAX_GUEST_UPLOAD_BYTES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
