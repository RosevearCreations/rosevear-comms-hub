-- QL-331 follow-up: indexes for NEW master_* foreign keys only.
-- Applied after additive master-shell RLS migration; no customer/data writes,
-- no permissions/grants changes, and no owner identity bootstrap.
CREATE INDEX IF NOT EXISTS master_child_tenants_shell_kind_fk_idx
  ON public.master_child_tenants (shell_id,shell_kind);
CREATE INDEX IF NOT EXISTS master_principals_enrolled_by_fk_idx
  ON public.master_principals (enrolled_by);
CREATE INDEX IF NOT EXISTS master_security_audit_actor_fk_idx
  ON public.master_security_audit (actor_user_id);
CREATE INDEX IF NOT EXISTS master_security_audit_shell_fk_idx
  ON public.master_security_audit (shell_id);
CREATE INDEX IF NOT EXISTS master_shell_grants_shell_child_fk_idx
  ON public.master_shell_grants (shell_id,child_tenant_id);
