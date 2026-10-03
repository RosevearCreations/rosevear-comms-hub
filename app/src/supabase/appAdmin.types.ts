// QL-009 explicit admin allowlist types.
// Keep this in sync with public.app_admins until full generated database types are regenerated.

export type AppAdminRole = 'owner' | 'admin' | 'staff_readonly';

export interface AppAdminRow {
  id: string;
  email: string;
  role: AppAdminRole;
  brand_scope: string[];
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppAdminInsert {
  email: string;
  role?: AppAdminRole;
  brand_scope?: string[];
  active?: boolean;
  notes?: string | null;
}
