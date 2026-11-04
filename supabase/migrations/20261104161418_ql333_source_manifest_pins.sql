-- QL-333: public-source manifest observation and independent signature pin boundary.
-- Source metadata is not an authentication or child-tenant grant.
-- This is server-only; no browser policies, RPC, secrets or automatic activations.
CREATE TABLE public.master_source_manifest_pins (
  pin_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  source_issuer text NOT NULL CHECK (length(source_issuer) BETWEEN 3 AND 256),
  source_repository text NOT NULL CHECK (source_repository ~ '^RosevearCreations/[A-Za-z0-9-]{2,80}$'),
  source_main_sha char(40) NOT NULL CHECK (source_main_sha ~ '^[a-f0-9]{40}$'),
  raw_manifest_sha256 char(64) NOT NULL CHECK (raw_manifest_sha256 ~ '^[a-f0-9]{64}$'),
  manifest_version text NOT NULL CHECK (manifest_version ~ '^1\.[0-9]+\.[0-9]+$'),
  source_revision text NOT NULL CHECK (length(source_revision) BETWEEN 7 AND 128),
  allowed_manifest_path text NOT NULL DEFAULT '/.well-known/rosevear-integration-manifest.json'
    CHECK (allowed_manifest_path = '/.well-known/rosevear-integration-manifest.json'),
  requested_scope text NOT NULL DEFAULT 'public_nonsecret_discovery_only'
    CHECK (requested_scope = 'public_nonsecret_discovery_only'),
  peer_issuer_record_id uuid,
  state text NOT NULL DEFAULT 'DISCOVERED_UNSIGNED'
    CHECK (state IN ('DISCOVERED_UNSIGNED','SIGNED_PENDING_INDEPENDENT','VERIFIED','QUARANTINED')),
  owner_test_authorization_sha256 char(64) CHECK (owner_test_authorization_sha256 ~ '^[a-f0-9]{64}$'),
  independent_verification_sha256 char(64) CHECK (independent_verification_sha256 ~ '^[a-f0-9]{64}$'),
  verified_at timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,peer_issuer_record_id)
    REFERENCES public.master_peer_issuers(shell_id,issuer_record_id) ON DELETE RESTRICT,
  UNIQUE(shell_id,source_main_sha,raw_manifest_sha256),
  CHECK (state <> 'VERIFIED' OR (
    peer_issuer_record_id IS NOT NULL AND owner_test_authorization_sha256 IS NOT NULL
    AND independent_verification_sha256 IS NOT NULL AND verified_at IS NOT NULL
  )),
  CHECK (state = 'VERIFIED' OR verified_at IS NULL)
);
CREATE INDEX master_source_manifest_pins_latest
  ON public.master_source_manifest_pins(shell_id,observed_at DESC);
CREATE INDEX master_source_manifest_pins_peer_fk
  ON public.master_source_manifest_pins(shell_id,peer_issuer_record_id);

ALTER TABLE public.master_source_manifest_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_source_manifest_pins FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.master_source_manifest_pins FROM PUBLIC,anon,authenticated;
COMMENT ON TABLE public.master_source_manifest_pins IS
  'QL-333 immutable public-source digest observations; VERIFIED needs independent signer, owner and source proof. No permission to call a peer is inferred.';
