-- QL-331: authenticated master shell registry, strict least-privilege RLS.
-- Target: the existing Comms Hub "rosevearcreations Project" Supabase instance.
-- Creates NEW master_* tables only; does not alter customer tables, existing
-- app_admins, Supabase Auth users, source credentials or remote applications.
-- Real owner enrollment requires a verified Supabase Auth user and separately
-- authorized server-only membership creation. NEVER seed a fabricated owner.
--
-- DB is the enforcement boundary. User-editable JWT user_metadata and browser
-- role previews are never trusted for authorization. No SECURITY DEFINER grants.

CREATE TABLE IF NOT EXISTS public.master_principals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  master_role text NOT NULL CHECK (master_role IN ('owner','admin','auditor','shell_operator')),
  active boolean NOT NULL DEFAULT false,
  enrolled_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  enrollment_receipt_digest char(64) CHECK (
    enrollment_receipt_digest IS NULL OR
    enrollment_receipt_digest ~ '^[0-9a-f]{64}$'
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT active OR enrollment_receipt_digest IS NOT NULL)
);
COMMENT ON TABLE public.master_principals IS
  'QL-331 master identity binding to verified Supabase Auth user IDs. Zero automatic owner enrollments or grants.';

CREATE TABLE IF NOT EXISTS public.master_shell_registry (
  shell_id text PRIMARY KEY CHECK (shell_id ~ '^[a-z][a-z0-9-]{1,63}$'),
  source_app_id text NOT NULL,
  shell_kind text NOT NULL CHECK (shell_kind IN ('business','support')),
  display_name text NOT NULL,
  source_repository text NOT NULL,
  connection_status text NOT NULL DEFAULT 'DISCONNECTED / HOLD'
    CHECK (connection_status IN ('DISCONNECTED / HOLD','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shell_id, shell_kind)
);
COMMENT ON TABLE public.master_shell_registry IS
  'Six canonical source applications; YW/iCamp are platform shells, not individual business customers.';

CREATE TABLE IF NOT EXISTS public.master_child_tenants (
  shell_id text NOT NULL,
  shell_kind text NOT NULL DEFAULT 'business' CHECK (shell_kind = 'business'),
  child_tenant_id uuid NOT NULL,
  source_owned_id text NOT NULL,
  display_name text NOT NULL,
  state text NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING','DISABLED','AUTHORIZED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shell_id, child_tenant_id),
  UNIQUE (shell_id, source_owned_id),
  FOREIGN KEY (shell_id, shell_kind)
    REFERENCES public.master_shell_registry(shell_id, shell_kind) ON DELETE RESTRICT
);
COMMENT ON TABLE public.master_child_tenants IS
  'Only source-authoritative child IDs may be enrolled later; none are seeded by QL-331.';

CREATE TABLE IF NOT EXISTS public.master_shell_grants (
  grant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.master_principals(user_id) ON DELETE RESTRICT,
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  child_tenant_id uuid,
  grant_scope text NOT NULL CHECK (grant_scope IN ('shell_read','shell_operator','child_read')),
  state text NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING','ACTIVE','REVOKED')),
  evidence_digest char(64) CHECK (evidence_digest IS NULL OR evidence_digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (child_tenant_id IS NULL AND grant_scope IN ('shell_read','shell_operator'))
    OR (child_tenant_id IS NOT NULL AND grant_scope = 'child_read')
  ),
  CHECK (state <> 'ACTIVE' OR evidence_digest IS NOT NULL),
  FOREIGN KEY (shell_id, child_tenant_id)
    REFERENCES public.master_child_tenants(shell_id, child_tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS master_shell_grants_identity_scope_unique
  ON public.master_shell_grants (user_id, shell_id, child_tenant_id, grant_scope)
  NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS master_shell_grants_subject_lookup
  ON public.master_shell_grants (user_id, state, shell_id, child_tenant_id);
COMMENT ON TABLE public.master_shell_grants IS
  'Explicit separately approved shell and child grants. Master ownership never implies child access.';

CREATE TABLE IF NOT EXISTS public.master_security_audit (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  shell_id text REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  action_code text NOT NULL,
  receipt_sha256 char(64) NOT NULL CHECK (receipt_sha256 ~ '^[0-9a-f]{64}$'),
  inserted_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.master_security_audit IS
  'Server-only future append-only audit; QL-331 creates no fabricated witness or event.';

-- Existing Supabase public schema is API-exposed. Deny every new table unless a
-- valid JWT is authenticated AND a source-controlled row-level policy permits
-- a specifically scoped read. All writes stay server-only / not yet enabled.
REVOKE ALL ON TABLE public.master_principals,
  public.master_shell_registry, public.master_child_tenants,
  public.master_shell_grants, public.master_security_audit
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.master_principals, public.master_shell_registry,
  public.master_child_tenants, public.master_shell_grants TO authenticated;

ALTER TABLE public.master_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_principals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_shell_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_shell_registry FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_child_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_child_tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_shell_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_shell_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_security_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_security_audit FORCE ROW LEVEL SECURITY;

-- No client-side INSERT, UPDATE, DELETE policies exist for any master_* table.
-- We keep the policies SELECT only and bind every identity to auth.uid()
-- (the validated Supabase Auth subject), never to an input email or JWT
-- user_metadata attribute.

CREATE POLICY master_principal_self_read
  ON public.master_principals FOR SELECT TO authenticated
  USING (active AND user_id = (SELECT auth.uid()));

CREATE POLICY master_grant_own_active_read
  ON public.master_shell_grants FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND state = 'ACTIVE'
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM public.master_principals p
      WHERE p.user_id = (SELECT auth.uid()) AND p.active
    )
  );

CREATE POLICY master_shell_authorized_metadata_read
  ON public.master_shell_registry FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.master_principals p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.active AND p.master_role IN ('owner','admin','auditor')
    )
    OR EXISTS (
      SELECT 1 FROM public.master_shell_grants g
      WHERE g.user_id = (SELECT auth.uid())
        AND g.shell_id = master_shell_registry.shell_id
        AND g.child_tenant_id IS NULL
        AND g.grant_scope IN ('shell_read','shell_operator')
        AND g.state = 'ACTIVE'
    )
  );

CREATE POLICY master_child_exact_tenant_grant_read
  ON public.master_child_tenants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.master_shell_grants g
      WHERE g.user_id = (SELECT auth.uid())
        AND g.shell_id = master_child_tenants.shell_id
        AND g.child_tenant_id = master_child_tenants.child_tenant_id
        AND g.grant_scope = 'child_read'
        AND g.state = 'ACTIVE'
    )
  );

-- Safe six-row source registry: no fake customers or private tokens.
INSERT INTO public.master_shell_registry
  (shell_id, source_app_id, shell_kind, display_name, source_repository, connection_status)
VALUES
  ('yw','yard-workers','business','Yard Workers','RosevearCreations/yw','DISCONNECTED / HOLD'),
  ('icamp','icamp','business','iCamp','RosevearCreations/iCamp','DISCONNECTED / HOLD'),
  ('rosiedazzlers','rosiedazzlers','business','Rosie Dazzlers','RosevearCreations/rosiedazzlers','DISCONNECTED / HOLD'),
  ('devilndove','devilndove','business','Devil n Dove','RosevearCreations/devilndove-site','DISCONNECTED / HOLD'),
  ('ai-data-platform','ai-data-platform','support','AI Data Platform','RosevearCreations/ai-data-platform','DISCONNECTED / HOLD'),
  ('rosevear-ai-hub','rosevear-ai-hub','support','Rosevear AI Hub','RosevearCreations/rosevear-ai-hub','DISCONNECTED / HOLD')
ON CONFLICT (shell_id) DO NOTHING;
