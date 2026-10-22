import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { BrandId } from '../types';

export type SupabaseReadOnlyClientStatus =
  | 'disabled_missing_env'
  | 'disabled_by_kill_switch'
  | 'blocked_unexpected_project'
  | 'ready_read_only';

export type SupabaseReadOnlyClientState = {
  status: SupabaseReadOnlyClientStatus;
  expectedProjectUrl: string;
  configuredProjectUrl: string | null;
  anonKeyConfigured: boolean;
  readsEnabled: boolean;
  canCreateClient: boolean;
  message: string;
};

export type SyntheticConversationReadRow = {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
  status: string;
  summary: string;
  draft: string;
  created_at: string;
};

export type SyntheticSystemStatusReadRow = {
  id: string;
  label: string;
  status: 'ready' | 'blocked' | 'planned';
  detail: string;
  created_at: string;
};

export const expectedSupabaseProjectUrl = 'https://gxujcwpktaickcgzyvnu.supabase.co';

export const allowedReadOnlySources = [
  'public.ql_public_synthetic_conversations',
  'public.ql_public_system_status'
] as const;

export const blockedBrowserSources = [
  'contacts',
  'conversations',
  'messages',
  'phone_calls',
  'sms_messages',
  'provider_payloads',
  'consent_logs',
  'app_admins',
  'audit_events',
  'archives',
  'retention_records'
] as const;

export const readOnlyFallbackRules = [
  'Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or VITE_QL_ENABLE_SUPABASE_READS=true keeps local synthetic samples active.',
  'Unexpected Supabase project URLs are blocked before a client is created.',
  'Reads are limited to explicit public synthetic views and never use live customer/provider/admin tables.',
  'Errors or unexpected payloads must fall back to local synthetic samples without mutating browser or database state.'
] as const;

function getTrimmedEnvValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function getSupabaseReadOnlyClientState(): SupabaseReadOnlyClientState {
  const configuredProjectUrl = getTrimmedEnvValue(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = getTrimmedEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const readsEnabled = import.meta.env.VITE_QL_ENABLE_SUPABASE_READS === 'true';

  if (!configuredProjectUrl || !anonKey) {
    return {
      status: 'disabled_missing_env',
      expectedProjectUrl: expectedSupabaseProjectUrl,
      configuredProjectUrl: configuredProjectUrl || null,
      anonKeyConfigured: Boolean(anonKey),
      readsEnabled,
      canCreateClient: false,
      message: 'Supabase read-only scaffold is present, but required browser-safe env values are missing.'
    };
  }

  if (configuredProjectUrl !== expectedSupabaseProjectUrl) {
    return {
      status: 'blocked_unexpected_project',
      expectedProjectUrl: expectedSupabaseProjectUrl,
      configuredProjectUrl,
      anonKeyConfigured: true,
      readsEnabled,
      canCreateClient: false,
      message: 'Supabase read-only scaffold blocked an unexpected project URL.'
    };
  }

  if (!readsEnabled) {
    return {
      status: 'disabled_by_kill_switch',
      expectedProjectUrl: expectedSupabaseProjectUrl,
      configuredProjectUrl,
      anonKeyConfigured: true,
      readsEnabled,
      canCreateClient: false,
      message: 'Supabase env values are present, but browser reads remain disabled until VITE_QL_ENABLE_SUPABASE_READS=true.'
    };
  }

  return {
    status: 'ready_read_only',
    expectedProjectUrl: expectedSupabaseProjectUrl,
    configuredProjectUrl,
    anonKeyConfigured: true,
    readsEnabled,
    canCreateClient: true,
    message: 'Supabase read-only scaffold can create an anon-key client for explicit synthetic public views only.'
  };
}

export function createSupabaseReadOnlyClient(): SupabaseClient | null {
  const state = getSupabaseReadOnlyClientState();

  if (!state.canCreateClient) {
    return null;
  }

  return createClient(state.configuredProjectUrl ?? expectedSupabaseProjectUrl, getTrimmedEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-ql-preview-mode': 'public-disabled-read-only'
      }
    }
  });
}

export async function loadSyntheticConversationRows(selectedBrandId: BrandId): Promise<{
  source: 'supabase' | 'fallback';
  rows: unknown;
  error?: string;
}> {
  const client = createSupabaseReadOnlyClient();

  if (!client) {
    return { source: 'fallback', rows: [], error: getSupabaseReadOnlyClientState().message };
  }

  const { data, error } = await client
    .from('ql_public_synthetic_conversations')
    .select('id,brand_id,brand_name,title,status,summary,draft,created_at')
    // QL-167: scope the public synthetic read before any rows reach the browser.
    .eq('brand_id', selectedBrandId)
    .order('id', { ascending: true });

  if (error) {
    return { source: 'fallback', rows: [], error: error.message };
  }

  return { source: 'supabase', rows: data };
}

export async function loadSyntheticSystemStatusRows(): Promise<{
  source: 'supabase' | 'fallback';
  rows: unknown;
  error?: string;
}> {
  const client = createSupabaseReadOnlyClient();

  if (!client) {
    return { source: 'fallback', rows: [], error: getSupabaseReadOnlyClientState().message };
  }

  const { data, error } = await client
    .from('ql_public_system_status')
    .select('id,label,status,detail,created_at')
    .order('id', { ascending: true });

  if (error) {
    return { source: 'fallback', rows: [], error: error.message };
  }

  return { source: 'supabase', rows: data };
}
