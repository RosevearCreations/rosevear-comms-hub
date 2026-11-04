-- QL-332: private, fail-closed peer/key custody metadata. No secret values,
-- workload tokens, signing private keys, owner grants or live peer enrolment.
-- The existing six master shells are the only possible parent identities.
-- A trusted private broker must enforce cross-table trust before writing;
-- no browser/Data API grants or client RPCs are created by this migration.

CREATE TABLE public.master_workload_identities (
  workload_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('CLOUDFLARE_WORKER_OIDC','MANAGED_KMS_OIDC')),
  workload_subject text NOT NULL CHECK (length(workload_subject) BETWEEN 12 AND 512),
  state text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','VERIFIED','REVOKED')),
  attestation_sha256 char(64) CHECK (attestation_sha256 ~ '^[0-9a-f]{64}$'),
  independently_verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider,workload_subject),
  CHECK (state <> 'VERIFIED' OR (
    attestation_sha256 IS NOT NULL AND independently_verified_at IS NOT NULL
    AND expires_at > independently_verified_at
  ))
);
COMMENT ON TABLE public.master_workload_identities IS
  'Nonsecret, independently attested private broker workload subjects; no credentials or OIDC tokens.';

CREATE TABLE public.master_peer_issuers (
  issuer_record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  source_issuer_id text NOT NULL CHECK (length(source_issuer_id) BETWEEN 3 AND 256),
  source_revision text NOT NULL CHECK (length(source_revision) BETWEEN 7 AND 128),
  public_key_sha256 char(64) NOT NULL CHECK (public_key_sha256 ~ '^[0-9a-f]{64}$'),
  key_algorithm text NOT NULL CHECK (key_algorithm IN ('Ed25519','ES256')),
  state text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','VERIFIED','REVOKED')),
  original_proof_b_sha256 char(64) CHECK (original_proof_b_sha256 ~ '^[0-9a-f]{64}$'),
  source_owner_approval_sha256 char(64) CHECK (source_owner_approval_sha256 ~ '^[0-9a-f]{64}$'),
  independent_custody_sha256 char(64) CHECK (independent_custody_sha256 ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shell_id,issuer_record_id),
  UNIQUE (shell_id,source_issuer_id,public_key_sha256),
  CHECK (state <> 'VERIFIED' OR (
    original_proof_b_sha256 IS NOT NULL
    AND source_owner_approval_sha256 IS NOT NULL
    AND independent_custody_sha256 IS NOT NULL
    AND verified_at IS NOT NULL AND revoked_at IS NULL
  )),
  CHECK (state <> 'REVOKED' OR revoked_at IS NOT NULL)
);
COMMENT ON TABLE public.master_peer_issuers IS
  'Pinned PUBLIC key fingerprints only; real source Proof-B and custody must be independently checked before verification.';

CREATE TABLE public.master_managed_key_handles (
  handle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (purpose IN ('BROKER_SIGN','BROKER_DECRYPT','PEER_VERIFY')),
  provider text NOT NULL CHECK (provider IN ('SUPABASE_VAULT','MANAGED_KMS')),
  opaque_ref text NOT NULL CHECK (
    (provider = 'SUPABASE_VAULT' AND opaque_ref ~ '^vault:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    OR (provider = 'MANAGED_KMS' AND opaque_ref ~ '^kms:[a-zA-Z0-9/_:.@-]{12,240}$')
  ),
  key_version integer NOT NULL CHECK (key_version BETWEEN 1 AND 1000000),
  issuer_record_id uuid,
  workload_id uuid NOT NULL REFERENCES public.master_workload_identities(workload_id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING','STAGED','DUAL_KEY','ACTIVE','RETIRING','REVOKED','QUARANTINED')),
  activation_receipt_sha256 char(64) CHECK (activation_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  next_rotation_at timestamptz,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shell_id,purpose,key_version),
  UNIQUE (shell_id,purpose,handle_id),
  UNIQUE (provider,opaque_ref),
  FOREIGN KEY (shell_id,issuer_record_id)
    REFERENCES public.master_peer_issuers(shell_id,issuer_record_id) ON DELETE RESTRICT,
  CHECK (expires_at > created_at),
  CHECK (next_rotation_at IS NULL OR next_rotation_at < expires_at),
  CHECK (state NOT IN ('DUAL_KEY','ACTIVE','RETIRING') OR (
    activation_receipt_sha256 IS NOT NULL AND issuer_record_id IS NOT NULL
  )),
  CHECK (state <> 'REVOKED' OR revoked_at IS NOT NULL)
);
CREATE INDEX master_managed_handle_issuer_fk
  ON public.master_managed_key_handles(shell_id,issuer_record_id);
CREATE INDEX master_managed_handle_workload_fk
  ON public.master_managed_key_handles(workload_id);
COMMENT ON TABLE public.master_managed_key_handles IS
  'Opaque Vault/KMS reference, not a secret. All key changes require the private broker and authenticated source-side evidence.';

CREATE TABLE public.master_rotation_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (purpose IN ('BROKER_SIGN','BROKER_DECRYPT','PEER_VERIFY')),
  previous_handle_id uuid NOT NULL,
  candidate_handle_id uuid,
  due_at timestamptz NOT NULL,
  overlap_until timestamptz,
  state text NOT NULL DEFAULT 'DUE'
    CHECK (state IN ('DUE','CLAIMED','DUAL_KEY','BOTH_VERIFIED','CUTOVER','QUARANTINED','CANCELLED')),
  lease_token_sha256 char(64) CHECK (lease_token_sha256 ~ '^[0-9a-f]{64}$'),
  lease_expires_at timestamptz,
  both_sides_receipt_sha256 char(64) CHECK (both_sides_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  owner_authorization_sha256 char(64) CHECK (owner_authorization_sha256 ~ '^[0-9a-f]{64}$'),
  source_authorization_sha256 char(64) CHECK (source_authorization_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,purpose,previous_handle_id)
    REFERENCES public.master_managed_key_handles(shell_id,purpose,handle_id) ON DELETE RESTRICT,
  FOREIGN KEY (shell_id,purpose,candidate_handle_id)
    REFERENCES public.master_managed_key_handles(shell_id,purpose,handle_id) ON DELETE RESTRICT,
  CHECK (candidate_handle_id IS NULL OR candidate_handle_id <> previous_handle_id),
  CHECK (overlap_until IS NULL OR overlap_until > due_at),
  CHECK (state NOT IN ('DUAL_KEY','BOTH_VERIFIED','CUTOVER') OR (
    candidate_handle_id IS NOT NULL AND overlap_until IS NOT NULL
    AND owner_authorization_sha256 IS NOT NULL
    AND source_authorization_sha256 IS NOT NULL
  )),
  CHECK (state NOT IN ('BOTH_VERIFIED','CUTOVER') OR both_sides_receipt_sha256 IS NOT NULL)
);
CREATE UNIQUE INDEX master_rotation_single_inflight_per_scope
  ON public.master_rotation_jobs(shell_id,purpose)
  WHERE state IN ('DUE','CLAIMED','DUAL_KEY','BOTH_VERIFIED');
CREATE INDEX master_rotation_due_lookup ON public.master_rotation_jobs(state,due_at);
CREATE INDEX master_rotation_previous_handle_fk
  ON public.master_rotation_jobs(shell_id,purpose,previous_handle_id);
CREATE INDEX master_rotation_candidate_handle_fk
  ON public.master_rotation_jobs(shell_id,purpose,candidate_handle_id);
COMMENT ON TABLE public.master_rotation_jobs IS
  'Serialized overlap/cutover intentions; no pg_cron or live key rotation enabled without private worker enrollment.';

CREATE TABLE public.master_custody_receipts (
  receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  job_id uuid REFERENCES public.master_rotation_jobs(job_id) ON DELETE RESTRICT,
  event_kind text NOT NULL CHECK (event_kind IN
    ('BOOTSTRAP_VERIFIED','KEY_STAGED','DUAL_KEY_VERIFIED','CUTOVER','QUARANTINED','EMERGENCY_REVOKED','DENIED')),
  idempotency_sha256 char(64) NOT NULL UNIQUE CHECK (idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  source_receipt_sha256 char(64) NOT NULL CHECK (source_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  broker_receipt_sha256 char(64) NOT NULL CHECK (broker_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  inserted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX master_custody_receipt_shell_fk
  ON public.master_custody_receipts(shell_id);
CREATE INDEX master_custody_receipt_job_fk
  ON public.master_custody_receipts(job_id);
COMMENT ON TABLE public.master_custody_receipts IS
  'Append-only nonsecret digests; no bearer tokens, plaintext keys, customer data or invented signed receipts.';

CREATE SCHEMA IF NOT EXISTS master_private;
REVOKE ALL ON SCHEMA master_private FROM PUBLIC, anon, authenticated;
CREATE FUNCTION master_private.ql332_receipt_append_only()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'QL332_RECEIPT_IMMUTABLE';
END;
$$;
REVOKE ALL ON FUNCTION master_private.ql332_receipt_append_only() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER master_custody_receipt_no_edit
  BEFORE UPDATE OR DELETE ON public.master_custody_receipts
  FOR EACH ROW EXECUTE FUNCTION master_private.ql332_receipt_append_only();

REVOKE ALL ON TABLE public.master_workload_identities,public.master_peer_issuers,
  public.master_managed_key_handles,public.master_rotation_jobs,public.master_custody_receipts
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.master_workload_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_workload_identities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_peer_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_peer_issuers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_managed_key_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_managed_key_handles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_rotation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_rotation_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_custody_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_custody_receipts FORCE ROW LEVEL SECURITY;
-- No authenticated/anon SELECT or write policies. A narrowly authenticated,
-- separately deployed private broker will own future transitions. ZERO seeds.
