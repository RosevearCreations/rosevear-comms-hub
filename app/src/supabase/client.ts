import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
const enableSupabaseClient = import.meta.env.VITE_ENABLE_SUPABASE_CLIENT === 'true';
const enableHostedDatabase = import.meta.env.VITE_ENABLE_HOSTED_DATABASE === 'true';

let client: SupabaseClient<Database> | null = null;

export interface SupabaseClientConfigStatus {
  enabled: boolean;
  ready: boolean;
  urlConfigured: boolean;
  publishableKeyConfigured: boolean;
  reasons: string[];
}

export function getSupabaseClientConfigStatus(): SupabaseClientConfigStatus {
  const reasons: string[] = [];

  if (!enableSupabaseClient) {
    reasons.push('VITE_ENABLE_SUPABASE_CLIENT is not true.');
  }

  if (!enableHostedDatabase) {
    reasons.push('VITE_ENABLE_HOSTED_DATABASE is not true.');
  }

  if (!supabaseUrl) {
    reasons.push('VITE_SUPABASE_URL is missing.');
  }

  if (!supabasePublishableKey) {
    reasons.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing.');
  }

  return {
    enabled: enableSupabaseClient && enableHostedDatabase,
    ready: enableSupabaseClient && enableHostedDatabase && Boolean(supabaseUrl) && Boolean(supabasePublishableKey),
    urlConfigured: Boolean(supabaseUrl),
    publishableKeyConfigured: Boolean(supabasePublishableKey),
    reasons
  };
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const status = getSupabaseClientConfigStatus();

  if (!status.ready) {
    return null;
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return client;
}
