-- QL-337: only private metadata receipts. No live source connection, delivery or provider effects.
CREATE TABLE public.master_broker_event_inbox_ql337 (
  inbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app_id text NOT NULL CHECK (source_app_id='ai-data-platform'),
  origin_app_id text NOT NULL,
  shell_id text NOT NULL CHECK (shell_id IN ('yw','icamp','rosiedazzlers','devilndove')),
  tenant_id text NOT NULL CHECK (tenant_id ~ '^[a-z0-9][a-z0-9._:-]{0,63}$'),
  child_id text NOT NULL CHECK (child_id ~ '^[a-z0-9][a-z0-9._:-]{0,63}$'),
  event_id text NOT NULL CHECK (event_id ~ '^evt_[A-Za-z0-9_-]{12,80}$'),
  event_type text NOT NULL CHECK (event_type IN ('case.handoff.requested','task.followup.requested')),
  trace_id uuid NOT NULL,
  nonce text NOT NULL CHECK (nonce ~ '^[A-Za-z0-9_-]{22,64}$'),
  source_receipt_sha256 text NOT NULL CHECK (source_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  consent_sha256 text NOT NULL CHECK (consent_sha256 ~ '^[a-f0-9]{64}$'),
  envelope_sha256 text NOT NULL CHECK (envelope_sha256 ~ '^[a-f0-9]{64}$'),
  payload_ref text NOT NULL CHECK (payload_ref ~ '^ref_[A-Za-z0-9_-]{12,80}$'),
  delivery_state text NOT NULL DEFAULT 'HOLD' CHECK (delivery_state='HOLD'),
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql337_origin_shell_binding CHECK (
    (shell_id='yw' AND origin_app_id='yard-workers') OR
    (shell_id='icamp' AND origin_app_id='icamp') OR
    (shell_id='rosiedazzlers' AND origin_app_id='rosiedazzlers') OR
    (shell_id='devilndove' AND origin_app_id='devilndove')
  ),
  CONSTRAINT ql337_event_id_once UNIQUE (source_app_id,event_id),
  CONSTRAINT ql337_nonce_once UNIQUE (source_app_id,nonce)
);
CREATE INDEX ql337_inbox_scope_received ON public.master_broker_event_inbox_ql337
  (shell_id,tenant_id,child_id,received_at DESC);

CREATE TABLE public.master_broker_effect_receipts_ql337 (
  effect_receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id uuid NOT NULL REFERENCES public.master_broker_event_inbox_ql337(inbox_id) ON DELETE RESTRICT,
  effect_kind text NOT NULL CHECK (effect_kind IN ('CASE_REVIEW_HELD','TASK_REVIEW_HELD')),
  effect_state text NOT NULL DEFAULT 'HOLD' CHECK (effect_state='HOLD'),
  receipt_sha256 text NOT NULL CHECK (receipt_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql337_one_effect_per_event UNIQUE(inbox_id,effect_kind)
);

ALTER TABLE public.master_broker_event_inbox_ql337 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_broker_event_inbox_ql337 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_broker_event_inbox_ql337 FROM PUBLIC,anon,authenticated;
ALTER TABLE public.master_broker_effect_receipts_ql337 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_broker_effect_receipts_ql337 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_broker_effect_receipts_ql337 FROM PUBLIC,anon,authenticated;

CREATE TRIGGER ql337_event_inbox_append_only BEFORE UPDATE OR DELETE
  ON public.master_broker_event_inbox_ql337 FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
CREATE TRIGGER ql337_effect_receipts_append_only BEFORE UPDATE OR DELETE
  ON public.master_broker_effect_receipts_ql337 FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
