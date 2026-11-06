-- QL-341: six nonsecret source identities, none authorized to connect.
-- This does NOT provision a receiver login, a source API token or peer ingress.
CREATE TABLE public.master_hub_private_peers_ql341 (
  peer_id text PRIMARY KEY CHECK (peer_id IN ('rosiedazzlers','devilndove','icamp',
    'yw','ai-data-platform','rosevear-ai-hub')),
  peer_kind text NOT NULL CHECK (peer_kind IN ('business','support')),
  source_repo text NOT NULL CHECK (source_repo ~ '^[A-Za-z][A-Za-z0-9-]{1,63}$'),
  connection_state text NOT NULL DEFAULT 'HOLD' CHECK (connection_state='HOLD'),
  source_test_authorized boolean NOT NULL DEFAULT false CHECK (source_test_authorized=false),
  customer_data_allowed boolean NOT NULL DEFAULT false CHECK (customer_data_allowed=false),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql341_six_exact_peer_kinds CHECK (
    (peer_id IN ('rosiedazzlers','devilndove','icamp','yw') AND peer_kind='business') OR
    (peer_id IN ('ai-data-platform','rosevear-ai-hub') AND peer_kind='support'))
);
ALTER TABLE public.master_hub_private_peers_ql341 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_hub_private_peers_ql341 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_hub_private_peers_ql341
  FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.master_hub_private_peers_ql341 TO ql340c_private_receiver;
CREATE POLICY ql341_private_receiver_read_six_held_peers
  ON public.master_hub_private_peers_ql341
  FOR SELECT TO ql340c_private_receiver
  USING (connection_state='HOLD' AND source_test_authorized=false
    AND customer_data_allowed=false);
CREATE TRIGGER ql341_private_peer_registry_append_only
  BEFORE UPDATE OR DELETE ON public.master_hub_private_peers_ql341
  FOR EACH ROW EXECUTE FUNCTION public.ql334_reject_evidence_mutation();

INSERT INTO public.master_hub_private_peers_ql341 (peer_id,peer_kind,source_repo)
VALUES ('rosiedazzlers','business','rosiedazzlers'),
       ('devilndove','business','devilndove-site'),
       ('icamp','business','iCamp'),
       ('yw','business','yw'),
       ('ai-data-platform','support','ai-data-platform'),
       ('rosevear-ai-hub','support','rosevear-ai-hub');

-- To corroborate one REAL signed device heartbeat, the dedicated reader may
-- select *only* the listed receipt metadata. Existing QL-340C receipt RLS
-- still limits it to the single original Windows hub device/workload.
GRANT SELECT (device_id,workload_id,session_id,sequence_no,nonce,
  heartbeat_sha256,queue_depth,source_app_id,connection_state,received_at)
ON public.master_hub_relay_receipts_ql338 TO ql340c_private_receiver;
