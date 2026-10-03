import { getSupabaseClient, getSupabaseClientConfigStatus } from '../supabase/client';

export type AuthBoundaryMode =
  | 'local_only'
  | 'supabase_configured_but_disabled'
  | 'supabase_ready_auth_required';

export interface AuthBoundaryState {
  mode: AuthBoundaryMode;
  liveDataAllowed: boolean;
  canAttemptLogin: boolean;
  label: string;
  details: string;
  blockingReasons: string[];
}

export function getAuthBoundaryState(): AuthBoundaryState {
  const status = getSupabaseClientConfigStatus();

  if (status.ready) {
    return {
      mode: 'supabase_ready_auth_required',
      liveDataAllowed: false,
      canAttemptLogin: true,
      label: 'Supabase client ready / auth required',
      details: 'Supabase is configured, but live app data remains blocked until an authenticated allowlisted admin signs in.',
      blockingReasons: ['Live customer data access is feature-gated until the auth flow is implemented and verified.']
    };
  }

  if (status.urlConfigured || status.publishableKeyConfigured) {
    return {
      mode: 'supabase_configured_but_disabled',
      liveDataAllowed: false,
      canAttemptLogin: false,
      label: 'Supabase partially configured / live data disabled',
      details: 'The project URL may be present, but required flags or publishable key are missing. The app must remain local-first.',
      blockingReasons: status.reasons
    };
  }

  return {
    mode: 'local_only',
    liveDataAllowed: false,
    canAttemptLogin: false,
    label: 'Local-only safe mode',
    details: 'The admin shell uses browser localStorage only. No live Supabase reads or writes are attempted.',
    blockingReasons: status.reasons
  };
}

export async function hasSupabaseSession(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { data } = await client.auth.getSession();
  return Boolean(data.session);
}
