-- QL-330 NON-EXECUTED / REVIEW-ONLY proposal.
-- DO NOT run against a production database merely because code has deployed.
-- No master identity, KMS root, secure server runtime, source-owner authorization,
-- tenant permissions or external signed original proof is provisioned by this file.
-- SQL intentionally grants NO access to anon, authenticated or PUBLIC. No policies.
BEGIN;

CREATE SCHEMA IF NOT EXISTS rosevear_control;
REVOKE ALL ON SCHEMA rosevear_control FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS rosevear_control.application_shells (
  shell_id text PRIMARY KEY,
  integration_identity text NOT NULL UNIQUE,
  display_name text NOT NULL,
  source_repository text NOT NULL,
  shell_kind text NOT NULL CHECK (shell_kind IN ('business','support')),
  connection_state text NOT NULL DEFAULT 'DISCONNECTED / HOLD'
    CHECK (connection_state IN ('DISCONNECTED / HOLD','REVIEW_REQUIRED','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rosevear_control.child_tenants (
  shell_id text NOT NULL REFERENCES rosevear_control.application_shells(shell_id) ON DELETE RESTRICT,
  child_tenant_id uuid NOT NULL,
  source_owned_external_id text,
  display_name text NOT NULL,
  state text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','DISABLED','AUTHORIZED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shell_id,child_tenant_id),
  UNIQUE (shell_id,source_owned_external_id)
);

CREATE TABLE IF NOT EXISTS rosevear_control.managed_key_handles (
  handle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backend text NOT NULL CHECK (backend IN ('MANAGED_VAULT','MANAGED_KMS')),
  external_key_handle text NOT NULL UNIQUE,
  key_purpose text NOT NULL CHECK (key_purpose IN ('PEER_AUTH','ENVELOPE_UNWRAP','SIGNATURE_VERIFY')),
  key_version integer NOT NULL DEFAULT 1 CHECK (key_version>0),
  state text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','ACTIVE','ROTATING','REVOKED')),
  rotated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE rosevear_control.managed_key_handles IS
  'Opaque references only. The master decryption root/private key MUST exist outside this database in an independently secured managed vault/KMS. NEVER store plaintext secrets here.';

CREATE TABLE IF NOT EXISTS rosevear_control.connection_profiles (
  profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES rosevear_control.application_shells(shell_id) ON DELETE RESTRICT,
  child_tenant_id uuid,
  environment text NOT NULL CHECK (environment IN ('nonproduction')),
  transport_contract text NOT NULL DEFAULT 'rosevear.integration.v1',
  pinned_source_revision char(40),
  expected_audience text NOT NULL,
  approved_endpoint_path text NOT NULL CHECK (
    approved_endpoint_path IN ('/api/integration/v1/health','/api/integration/v1/capabilities')),
  key_handle_id uuid REFERENCES rosevear_control.managed_key_handles(handle_id),
  connection_state text NOT NULL DEFAULT 'DISCONNECTED / HOLD'
    CHECK (connection_state IN ('DISCONNECTED / HOLD','REVIEW_REQUIRED','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id,shell_id),
  FOREIGN KEY (shell_id,child_tenant_id)
    REFERENCES rosevear_control.child_tenants(shell_id,child_tenant_id) ON DELETE RESTRICT,
  CHECK (pinned_source_revision IS NULL OR pinned_source_revision ~ '^[a-f0-9]{40}$')
);

CREATE TABLE IF NOT EXISTS rosevear_control.procedure_versions (
  procedure_id text NOT NULL,
  version integer NOT NULL CHECK (version>0),
  purpose text NOT NULL CHECK (purpose IN ('CONNECTION','PORTAL','REPORT')),
  shell_id text REFERENCES rosevear_control.application_shells(shell_id),
  state text NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','UNDER_REVIEW','REJECTED')),
  immutable_digest_sha256 char(64),
  parent_version integer,
  change_reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (procedure_id,version),
  CHECK (immutable_digest_sha256 IS NULL OR immutable_digest_sha256 ~ '^[a-f0-9]{64}$'),
  CHECK (parent_version IS NULL OR parent_version<version)
);
CREATE TABLE IF NOT EXISTS rosevear_control.procedure_steps (
  procedure_id text NOT NULL,
  version integer NOT NULL,
  sequence_number integer NOT NULL CHECK (sequence_number>=1),
  step_id text NOT NULL CHECK (step_id IN (
    'discover_manifest','verify_issuer','approve_test','resolve_vault',
    'probe_readonly','verify_receipt','enable_scoped','portal_scope',
    'portal_readback','report_freshness','report_export','pause_on_failure','review_followup')),
  gate_id text NOT NULL,
  PRIMARY KEY (procedure_id,version,sequence_number),
  UNIQUE (procedure_id,version,step_id),
  FOREIGN KEY (procedure_id,version)
    REFERENCES rosevear_control.procedure_versions(procedure_id,version) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rosevear_control.authority_evidence (
  evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES rosevear_control.application_shells(shell_id),
  child_tenant_id uuid,
  proof_kind text NOT NULL CHECK (proof_kind IN ('SOURCE_PROOF_B','CUSTODIAN_WITNESS','OWNER_TEST','SOURCE_OWNER_TEST','CONSENT','REVOKE')),
  issuer_ref text NOT NULL,
  signed_receipt_digest_sha256 char(64) NOT NULL CHECK (signed_receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  independently_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,child_tenant_id)
    REFERENCES rosevear_control.child_tenants(shell_id,child_tenant_id) ON DELETE RESTRICT,
  CHECK (NOT independently_verified OR verified_at IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS rosevear_control.connection_rehearsals (
  run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES rosevear_control.connection_profiles(profile_id),
  procedure_id text NOT NULL,
  procedure_version integer NOT NULL,
  state text NOT NULL DEFAULT 'NO_GO_UNSENT' CHECK (state IN ('NO_GO_UNSENT','CANCELLED_UNSENT')),
  failure_code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  source_requests integer NOT NULL DEFAULT 0 CHECK (source_requests=0),
  source_writes integer NOT NULL DEFAULT 0 CHECK (source_writes=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (procedure_id,procedure_version)
    REFERENCES rosevear_control.procedure_versions(procedure_id,version)
);
COMMENT ON TABLE rosevear_control.connection_rehearsals IS
  'Synthetic/review-only holds. Real authenticated handshake execution requires separate private server schema and authorization, NOT these records.';

CREATE TABLE IF NOT EXISTS rosevear_control.portal_event_definitions (
  event_kind text PRIMARY KEY,
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  required_grant text NOT NULL,
  pii_permitted boolean NOT NULL DEFAULT false CHECK (pii_permitted=false),
  retention_days integer NOT NULL CHECK (retention_days BETWEEN 1 AND 365),
  definition_state text NOT NULL DEFAULT 'DRAFT' CHECK (definition_state IN ('DRAFT','UNDER_REVIEW','DISABLED'))
);
CREATE TABLE IF NOT EXISTS rosevear_control.portal_event_receipts (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL,
  child_tenant_id uuid NOT NULL,
  event_kind text NOT NULL REFERENCES rosevear_control.portal_event_definitions(event_kind),
  source_issuer_ref text NOT NULL,
  signed_event_digest_sha256 char(64) NOT NULL CHECK (signed_event_digest_sha256 ~ '^[a-f0-9]{64}$'),
  consent_receipt_id uuid REFERENCES rosevear_control.authority_evidence(evidence_id),
  received_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (shell_id,child_tenant_id)
    REFERENCES rosevear_control.child_tenants(shell_id,child_tenant_id) ON DELETE RESTRICT
);
COMMENT ON TABLE rosevear_control.portal_event_receipts IS
  'Proposed only, not a live ingestion endpoint. No customer names, message bodies, contact addresses or plaintext sensitive values.';

CREATE TABLE IF NOT EXISTS rosevear_control.report_definitions (
  report_id text NOT NULL,
  version integer NOT NULL CHECK (version>0),
  grain text NOT NULL CHECK (grain IN ('shell','child tenant','authorized child','authorized shell','approved aggregate')),
  required_grant text NOT NULL,
  source_receipt_required boolean NOT NULL DEFAULT true CHECK (source_receipt_required),
  state text NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','UNDER_REVIEW','DISABLED')),
  PRIMARY KEY (report_id,version)
);
CREATE TABLE IF NOT EXISTS rosevear_control.report_run_receipts (
  report_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL,
  report_version integer NOT NULL,
  shell_id text REFERENCES rosevear_control.application_shells(shell_id),
  child_tenant_id uuid,
  source_receipt_sha256 char(64) NOT NULL CHECK (source_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  data_freshness_at timestamptz,
  state text NOT NULL DEFAULT 'NO_DATA_HOLD' CHECK (state IN ('NO_DATA_HOLD','REJECTED')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (report_id,report_version)
    REFERENCES rosevear_control.report_definitions(report_id,version),
  FOREIGN KEY (shell_id,child_tenant_id)
    REFERENCES rosevear_control.child_tenants(shell_id,child_tenant_id)
);

CREATE TABLE IF NOT EXISTS rosevear_control.security_audit_receipts (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text REFERENCES rosevear_control.application_shells(shell_id),
  action_code text NOT NULL,
  actor_identity_ref text NOT NULL,
  receipt_digest_sha256 char(64) NOT NULL CHECK (receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  inserted_at timestamptz NOT NULL DEFAULT now()
);

-- Explicit deny by default: no publicly exposed grants and no RLS policies.
-- When a separately authenticated private service is created, add reviewed,
-- narrowly scoped DB roles/policies; do not reuse a browser service_role key.
REVOKE ALL ON ALL TABLES IN SCHEMA rosevear_control FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA rosevear_control FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rosevear_control REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rosevear_control REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

ALTER TABLE rosevear_control.application_shells ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.application_shells FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.child_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.child_tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.managed_key_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.managed_key_handles FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.connection_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.connection_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.procedure_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.procedure_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.procedure_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.procedure_steps FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.authority_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.authority_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.connection_rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.connection_rehearsals FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.portal_event_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.portal_event_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.portal_event_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.portal_event_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.report_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.report_run_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.report_run_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.security_audit_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosevear_control.security_audit_receipts FORCE ROW LEVEL SECURITY;

COMMIT;
