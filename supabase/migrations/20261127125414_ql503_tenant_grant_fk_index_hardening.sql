-- QL503 nonblocking performance hardening; exact-user FK lookup for RLS.
CREATE INDEX IF NOT EXISTS ql503_tenant_grant_user_fk_lookup
 ON public.ql503_tenant_read_grants (user_id,source_app,tenant_digest);
