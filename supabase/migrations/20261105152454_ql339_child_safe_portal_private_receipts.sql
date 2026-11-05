-- QL-339: metadata-only, source-signed child portal receipts. No public identities, customer
-- details, portal sessions, network connection, live delivery, exports or deletion jobs.
CREATE TABLE public.master_client_portal_journeys_ql339 (
  journey_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL CHECK (shell_id IN ('yw','icamp','rosiedazzlers','devilndove')),
  tenant_id text NOT NULL CHECK (tenant_id ~ '^[a-z0-9][a-z0-9._:-]{0,63}$'),
  child_id text NOT NULL CHECK (child_id ~ '^[a-z0-9][a-z0-9._:-]{0,63}$'),
  subject_ref text NOT NULL CHECK (subject_ref ~ '^ref_[A-Za-z0-9_-]{12,80}$'),
  case_ref text NOT NULL CHECK (case_ref ~ '^ref_[A-Za-z0-9_-]{12,80}$'),
  event_id text NOT NULL CHECK (event_id ~ '^evt_[A-Za-z0-9_-]{12,80}$'),
  event_type text NOT NULL CHECK (event_type IN ('case.opened','case.status.updated',
    'booking.status.updated','communication.preference.updated','consent.granted',
    'consent.revoked','session.revoked')),
  nonce text NOT NULL CHECK (nonce ~ '^[A-Za-z0-9_-]{22,64}$'),
  consent_receipt_sha256 text NOT NULL CHECK (consent_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  owner_grant_sha256 text NOT NULL CHECK (owner_grant_sha256 ~ '^[a-f0-9]{64}$'),
  source_receipt_sha256 text NOT NULL CHECK (source_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  event_sha256 text NOT NULL CHECK (event_sha256 ~ '^[a-f0-9]{64}$'),
  effect_state text NOT NULL DEFAULT 'HOLD' CHECK (effect_state='HOLD'),
  received_at timestamptz NOT NULL DEFAULT now(),
  retention_until timestamptz NOT NULL,
  CONSTRAINT ql339_one_event_per_child UNIQUE(shell_id,tenant_id,child_id,event_id),
  CONSTRAINT ql339_one_source_nonce UNIQUE(shell_id,nonce),
  CONSTRAINT ql339_retention_bounded CHECK (retention_until>received_at AND
    retention_until<=received_at+interval '366 days')
);
CREATE INDEX ql339_exact_child_subject_receipts ON public.master_client_portal_journeys_ql339
  (shell_id,tenant_id,child_id,subject_ref,received_at DESC);

ALTER TABLE public.master_client_portal_journeys_ql339 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_client_portal_journeys_ql339 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_client_portal_journeys_ql339 FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ql339_child_portal_append_only BEFORE UPDATE OR DELETE
  ON public.master_client_portal_journeys_ql339 FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();

COMMENT ON TABLE public.master_client_portal_journeys_ql339 IS
  'QL339 private metadata-only append-only TEST HOLD. Authenticated source-child grants must be verified on the private server. Retention expiration gates reads but cannot authorize unsupervised deletion.';
