-- Rosevear Creations: nonsecret master organization and dual-original-owner
-- TEST-only policy. No Supabase Auth users, privileges, source connections,
-- external-reviewer attestations or TEST receipts are fabricated here.
-- The QL-355/365C legacy independent-review pathway remains unchanged.

CREATE TABLE IF NOT EXISTS public.master_organizations (
  organization_id text PRIMARY KEY
    CHECK (organization_id ~ '^[a-z][a-z0-9-]{2,63}$'),
  display_name text NOT NULL,
  ownership_model text NOT NULL
    CHECK (ownership_model = 'TWO_DISTINCT_ORIGINAL_HUMAN_OWNERS'),
  test_policy text NOT NULL
    CHECK (test_policy = 'DUAL_OWNER_SIGNED_PRIVATE_HEALTH_GET_ONLY'),
  enrollment_state text NOT NULL DEFAULT 'PENDING_VERIFIED_AUTH_USERS'
    CHECK (enrollment_state IN ('PENDING_VERIFIED_AUTH_USERS','VERIFIED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_organization_shells (
  organization_id text NOT NULL REFERENCES public.master_organizations(organization_id)
    ON DELETE RESTRICT,
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id)
    ON DELETE RESTRICT,
  boundary text NOT NULL CHECK (boundary IN
    ('platform_shell','owned_business_shell','local_support')),
  connection_state text NOT NULL DEFAULT 'DISCONNECTED / HOLD'
    CHECK (connection_state = 'DISCONNECTED / HOLD'),
  child_tenant_access boolean NOT NULL DEFAULT false CHECK (NOT child_tenant_access),
  customer_operations boolean NOT NULL DEFAULT false CHECK (NOT customer_operations),
  PRIMARY KEY (organization_id,shell_id)
);

CREATE TABLE IF NOT EXISTS public.master_organization_owner_pins (
  organization_id text NOT NULL REFERENCES public.master_organizations(organization_id)
    ON DELETE RESTRICT,
  owner_role text NOT NULL CHECK (owner_role IN ('source','master')),
  original_host text NOT NULL,
  windows_user text NOT NULL,
  key_id text NOT NULL,
  spki_sha256 char(64) NOT NULL CHECK (spki_sha256 ~ '^[a-f0-9]{64}$'),
  original_public_sha256 char(64) NOT NULL
    CHECK (original_public_sha256 ~ '^[a-f0-9]{64}$'),
  enrollment_state text NOT NULL DEFAULT 'PUBLIC_PIN_ONLY_NO_AUTH_SESSION'
    CHECK (enrollment_state = 'PUBLIC_PIN_ONLY_NO_AUTH_SESSION'),
  PRIMARY KEY (organization_id,owner_role),
  UNIQUE (organization_id,spki_sha256)
);

-- Future genuine Auth-user membership is separate from the public pin above.
-- No membership is seeded by this migration; no row grants cross-tenant access.
CREATE TABLE IF NOT EXISTS public.master_organization_owner_memberships (
  organization_id text NOT NULL REFERENCES public.master_organizations(organization_id)
    ON DELETE RESTRICT,
  owner_role text NOT NULL CHECK (owner_role IN ('source','master')),
  user_id uuid NOT NULL REFERENCES public.master_principals(user_id)
    ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT false,
  signed_enrollment_receipt_sha256 char(64)
    CHECK (signed_enrollment_receipt_sha256 IS NULL OR
      signed_enrollment_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,owner_role),
  UNIQUE (organization_id,user_id),
  FOREIGN KEY (organization_id,owner_role)
    REFERENCES public.master_organization_owner_pins(organization_id,owner_role)
    ON DELETE RESTRICT,
  CHECK (NOT active OR signed_enrollment_receipt_sha256 IS NOT NULL)
);

-- Audit envelope only. A TEST success never changes a shell's connection state.
CREATE TABLE IF NOT EXISTS public.master_organization_private_test_receipts (
  receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL REFERENCES public.master_organizations(organization_id)
    ON DELETE RESTRICT,
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id)
    ON DELETE RESTRICT,
  operation_id uuid NOT NULL UNIQUE,
  intent_sha256 char(64) NOT NULL CHECK (intent_sha256 ~ '^[a-f0-9]{64}$'),
  signed_owner_decisions_sha256 char(64) NOT NULL
    CHECK (signed_owner_decisions_sha256 ~ '^[a-f0-9]{64}$'),
  signed_source_receipt_sha256 char(64) NOT NULL
    CHECK (signed_source_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  receiver_stop_sha256 char(64) NOT NULL
    CHECK (receiver_stop_sha256 ~ '^[a-f0-9]{64}$'),
  result text NOT NULL CHECK (result = 'PRIVATE_TEST_VERIFIED_STILL_HELD'),
  connected boolean NOT NULL DEFAULT false CHECK (NOT connected),
  customer_operations boolean NOT NULL DEFAULT false CHECK (NOT customer_operations),
  receiver_stopped boolean NOT NULL CHECK (receiver_stopped),
  inserted_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,shell_id)
    REFERENCES public.master_organization_shells(organization_id,shell_id)
    ON DELETE RESTRICT
);

REVOKE ALL ON TABLE public.master_organizations,
  public.master_organization_shells,
  public.master_organization_owner_pins,
  public.master_organization_owner_memberships,
  public.master_organization_private_test_receipts
  FROM PUBLIC,anon,authenticated;

ALTER TABLE public.master_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_shells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_shells FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_owner_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_owner_pins FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_owner_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_owner_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_private_test_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_organization_private_test_receipts FORCE ROW LEVEL SECURITY;

-- Authorized private server readback only. No browser policies, no self-grants.
INSERT INTO public.master_organizations
  (organization_id,display_name,ownership_model,test_policy)
VALUES ('rosevear-creations','Rosevear Creations',
  'TWO_DISTINCT_ORIGINAL_HUMAN_OWNERS',
  'DUAL_OWNER_SIGNED_PRIVATE_HEALTH_GET_ONLY')
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO public.master_organization_shells
  (organization_id,shell_id,boundary)
VALUES
  ('rosevear-creations','yw','platform_shell'),
  ('rosevear-creations','icamp','platform_shell'),
  ('rosevear-creations','rosiedazzlers','owned_business_shell'),
  ('rosevear-creations','devilndove','owned_business_shell'),
  ('rosevear-creations','ai-data-platform','local_support'),
  ('rosevear-creations','rosevear-ai-hub','local_support')
ON CONFLICT (organization_id,shell_id) DO NOTHING;

-- These are original public-only hashes already verified by Ree and Jack.
-- They are NOT actual Auth users, signed owner decisions or external witnesses.
INSERT INTO public.master_organization_owner_pins
  (organization_id,owner_role,original_host,windows_user,key_id,
    spki_sha256,original_public_sha256)
VALUES
  ('rosevear-creations','source','DESKTOP-AE894KC','ree',
    'source-owner-ql340a',
    'e3be0648e3c9c7737c2857a8d36d31ea5c74a69211a55ac201347ce220d3158e',
    'e37042d382be26bedda70f72fa7934018bca0513fd1b106243618d450eaa2e43'),
  ('rosevear-creations','master','TEMPLAR','jfros',
    'comms-master-jack-ql340a',
    '3b086d0f89e51311b458eb94aa585f7b7a797a86c8061c8cd0b4b4d0b75585d5',
    'f5b0f8cb970ca6504be63f75898c21491a4f83feac8b7c5c5e408e4b729e0f8f')
ON CONFLICT (organization_id,owner_role) DO NOTHING;
