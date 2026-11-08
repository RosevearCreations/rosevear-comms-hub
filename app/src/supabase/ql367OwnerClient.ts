import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Deliberately separate from optional customer/reference database reads.
// The owner portal may authenticate while every hosted-data/six-app flag stays OFF.
const ownerPortalEnabled = import.meta.env.VITE_ENABLE_MASTER_OWNER_LOGIN === 'true';
const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
const verifiedAuthOrigin = 'https://gxujcwpktaickcgzyvnu.supabase.co';
let ownerClient: SupabaseClient | null = null;

export function getOwnerPortalConfig() {
  return {
    enabled: ownerPortalEnabled,
    ready: ownerPortalEnabled && projectUrl === verifiedAuthOrigin && publicKey.startsWith('sb_publishable_'),
    reason: !ownerPortalEnabled ? 'Owner authentication is not enabled in this deployment.' :
      projectUrl !== verifiedAuthOrigin || !publicKey.startsWith('sb_publishable_') ?
        'The verified Supabase Auth origin or publishable-only key is not configured. No login was attempted.' : ''
  };
}

export function getOwnerAuthClient(): SupabaseClient | null {
  if (!getOwnerPortalConfig().ready) return null;
  if (!ownerClient) {
    ownerClient = createClient(projectUrl, publicKey, {
      auth: {
        storageKey: 'rosevear-comms-owner-session-v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return ownerClient;
}
