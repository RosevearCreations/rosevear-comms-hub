import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { AppAdminRow } from './appAdmin.types';

export type SupabaseReadModelMode = 'local_fallback' | 'supabase_reference' | 'error';

export interface SupabaseBrandReference {
  id: string;
  display_name: string;
  business_type: string;
  status: string;
}

export interface SupabaseReadModel {
  mode: SupabaseReadModelMode;
  loadedAt: string;
  brands: SupabaseBrandReference[];
  adminProfile: AppAdminRow | null;
  message: string;
}

export function createLocalFallbackReadModel(message = 'Supabase reference reads are disabled. Using local demo data.'): SupabaseReadModel {
  return {
    mode: 'local_fallback',
    loadedAt: new Date().toISOString(),
    brands: [],
    adminProfile: null,
    message
  };
}

export async function loadSupabaseReadModel(
  supabase: SupabaseClient<Database> | null,
  userEmail: string
): Promise<SupabaseReadModel> {
  if (!supabase) {
    return createLocalFallbackReadModel();
  }

  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('id,display_name,business_type,status')
    .order('id', { ascending: true });

  if (brandsError) {
    return {
      mode: 'error',
      loadedAt: new Date().toISOString(),
      brands: [],
      adminProfile: null,
      message: brandsError.message
    };
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  let adminProfile: AppAdminRow | null = null;

  if (cleanEmail) {
    const { data: admin, error: adminError } = await (supabase as any)
      .from('app_admins')
      .select('id,email,role,brand_scope,active,notes,created_at,updated_at')
      .eq('email', cleanEmail)
      .eq('active', true)
      .maybeSingle();

    if (adminError) {
      return {
        mode: 'error',
        loadedAt: new Date().toISOString(),
        brands: brands ?? [],
        adminProfile: null,
        message: adminError.message
      };
    }

    adminProfile = (admin as AppAdminRow | null) ?? null;
  }

  return {
    mode: 'supabase_reference',
    loadedAt: new Date().toISOString(),
    brands: brands ?? [],
    adminProfile,
    message: 'Supabase reference data loaded. Customer-data reads and writes remain disabled.'
  };
}
