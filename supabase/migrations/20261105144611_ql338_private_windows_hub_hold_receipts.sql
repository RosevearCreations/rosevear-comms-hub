-- QL-338: private nonproduction device heartbeat HOLD receipts; no Windows enrollment or network activation.
CREATE TABLE public.master_hub_relay_receipts_ql338 (
  receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app_id text NOT NULL DEFAULT 'rosevear-ai-hub' CHECK (source_app_id='rosevear-ai-hub'),
  device_id text NOT NULL CHECK (device_id ~ '^[a-z0-9][a-z0-9._:-]{1,63}$'),
  workload_id text NOT NULL CHECK (workload_id ~ '^[a-z0-9][a-z0-9._:-]{1,63}$'),
  session_id uuid NOT NULL,
  sequence_no bigint NOT NULL CHECK (sequence_no>0),
  nonce text NOT NULL CHECK (nonce ~ '^[A-Za-z0-9_-]{22,64}$'),
  heartbeat_sha256 text NOT NULL CHECK (heartbeat_sha256 ~ '^[a-f0-9]{64}$'),
  queue_depth smallint NOT NULL CHECK (queue_depth BETWEEN 0 AND 100),
  connection_state text NOT NULL DEFAULT 'HOLD' CHECK (connection_state='HOLD'),
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql338_one_device_sequence UNIQUE (device_id,session_id,sequence_no),
  CONSTRAINT ql338_one_nonce UNIQUE (source_app_id,nonce)
);
CREATE INDEX ql338_hub_received ON public.master_hub_relay_receipts_ql338 (device_id,received_at DESC);
ALTER TABLE public.master_hub_relay_receipts_ql338 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_hub_relay_receipts_ql338 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_hub_relay_receipts_ql338 FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ql338_hub_receipts_append_only BEFORE UPDATE OR DELETE
  ON public.master_hub_relay_receipts_ql338 FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
