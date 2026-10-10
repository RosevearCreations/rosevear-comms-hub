/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_BRAND?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_QL_ENABLE_SUPABASE_READS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
