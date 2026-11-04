-- QL-335: shell-level *nonproduction* targets. Creation does not establish trust.
-- All rows remain held until independently verified original signer, workload,
-- source-owner and owner TEST receipts plus a pinned HTTPS origin are installed.
CREATE TABLE public.master_shell_handshake_profiles (
  shell_id text PRIMARY KEY REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  source_app_id text NOT NULL,
  contract text NOT NULL DEFAULT 'rosevear.shell.nonproduction.v1'
    CHECK (contract='rosevear.shell.nonproduction.v1'),
  environment text NOT NULL DEFAULT 'nonproduction' CHECK (environment='nonproduction'),
  health_path text NOT NULL DEFAULT '/api/integration/v1/shell/health'
    CHECK (health_path='/api/integration/v1/shell/health'),
  capabilities_path text NOT NULL DEFAULT '/api/integration/v1/shell/capabilities'
    CHECK (capabilities_path='/api/integration/v1/shell/capabilities'),
  pinned_origin text CHECK (pinned_origin IS NULL OR pinned_origin ~ '^https://[a-z0-9.-]+$'),
  broker_workload_id uuid REFERENCES public.master_workload_identities(workload_id) ON DELETE RESTRICT,
  source_issuer_record_id uuid REFERENCES public.master_peer_issuers(issuer_record_id) ON DELETE RESTRICT,
  source_manifest_pin_id uuid REFERENCES public.master_source_manifest_pins(pin_id) ON DELETE RESTRICT,
  source_key_handle_id uuid REFERENCES public.master_managed_key_handles(handle_id) ON DELETE RESTRICT,
  source_owner_test_receipt_sha256 char(64) CHECK (source_owner_test_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  master_owner_test_receipt_sha256 char(64) CHECK (master_owner_test_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'HOLD' CHECK (state='HOLD'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((shell_id='yw' AND source_app_id='yard-workers') OR
         (shell_id='icamp' AND source_app_id='icamp'))
);

-- Source-signed receipts are inserted only by an independently authorized
-- private workload in a later activation; nothing in this migration creates one.
CREATE TABLE public.master_shell_handshake_receipts (
  receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_handshake_profiles(shell_id) ON DELETE RESTRICT,
  contract text NOT NULL DEFAULT 'rosevear.shell.nonproduction.v1'
    CHECK (contract='rosevear.shell.nonproduction.v1'),
  path text NOT NULL CHECK (path IN ('/api/integration/v1/shell/health',
    '/api/integration/v1/shell/capabilities')),
  challenge_sha256 char(64) NOT NULL CHECK (challenge_sha256 ~ '^[a-f0-9]{64}$'),
  nonce_sha256 char(64) NOT NULL CHECK (nonce_sha256 ~ '^[a-f0-9]{64}$'),
  signed_source_receipt_sha256 char(64) NOT NULL CHECK (signed_source_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  broker_workload_id uuid NOT NULL REFERENCES public.master_workload_identities(workload_id) ON DELETE RESTRICT,
  source_issuer_record_id uuid NOT NULL REFERENCES public.master_peer_issuers(issuer_record_id) ON DELETE RESTRICT,
  source_key_handle_id uuid NOT NULL REFERENCES public.master_managed_key_handles(handle_id) ON DELETE RESTRICT,
  source_owner_test_receipt_sha256 char(64) NOT NULL CHECK (source_owner_test_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  master_owner_test_receipt_sha256 char(64) NOT NULL CHECK (master_owner_test_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  nonproduction_origin text NOT NULL CHECK (nonproduction_origin ~ '^https://[a-z0-9.-]+$'),
  connection_state text NOT NULL DEFAULT 'SIGNED_TEST_ONLY_NOT_CONNECTED'
    CHECK (connection_state='SIGNED_TEST_ONLY_NOT_CONNECTED'),
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shell_id,nonce_sha256),
  UNIQUE(shell_id,challenge_sha256)
);
CREATE INDEX master_shell_receipts_workload_fk ON public.master_shell_handshake_receipts(broker_workload_id);
CREATE INDEX master_shell_receipts_issuer_fk ON public.master_shell_handshake_receipts(source_issuer_record_id);
CREATE INDEX master_shell_receipts_handle_fk ON public.master_shell_handshake_receipts(source_key_handle_id);

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['master_shell_handshake_profiles','master_shell_handshake_receipts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated',t);
  END LOOP;
END $$;
CREATE TRIGGER ql335_receipts_append_only BEFORE UPDATE OR DELETE ON public.master_shell_handshake_receipts
  FOR EACH ROW EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
INSERT INTO public.master_shell_handshake_profiles(shell_id,source_app_id) VALUES
  ('yw','yard-workers'),('icamp','icamp');
