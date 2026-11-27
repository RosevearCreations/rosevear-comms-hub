-- QL-503: read-only, authenticated, durable, tenant-isolated signed receipt history.
-- Nothing creates source-app access, invites users, starts services or sends messages.
-- Only a separately authenticated server using service_role can ingest, AFTER
-- independently verifying original source and provider signatures.
CREATE TABLE public.ql503_tenant_read_grants (
  source_app text NOT NULL CHECK (source_app IN ('icamp','yw','devilndove','rosiedazzlers')),
  tenant_digest char(64) NOT NULL CHECK (tenant_digest ~ '^[a-f0-9]{64}$'),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  access_role text NOT NULL CHECK (access_role IN ('operator','auditor')),
  source_approval_digest char(64) NOT NULL CHECK (source_approval_digest ~ '^[a-f0-9]{64}$'),
  active boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_app,tenant_digest,user_id),
  CHECK (expires_at > created_at)
);
COMMENT ON TABLE public.ql503_tenant_read_grants IS
 'Verified original-source approval only; no initial memberships or client-side grants.';

CREATE TABLE public.ql503_delivery_messages (
  source_app text NOT NULL CHECK (source_app IN ('icamp','yw','devilndove','rosiedazzlers')),
  tenant_digest char(64) NOT NULL CHECK (tenant_digest ~ '^[a-f0-9]{64}$'),
  thread_digest char(64) NOT NULL CHECK (thread_digest ~ '^[a-f0-9]{64}$'),
  message_key text NOT NULL CHECK (message_key ~ '^[A-Za-z0-9_-]{8,96}$'),
  message_version integer NOT NULL CHECK (message_version BETWEEN 1 AND 1000000),
  content_digest char(64) NOT NULL CHECK (content_digest ~ '^[a-f0-9]{64}$'),
  source_packet_digest char(64) NOT NULL CHECK (source_packet_digest ~ '^[a-f0-9]{64}$'),
  issued_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_app,tenant_digest,thread_digest,message_key,message_version)
);
CREATE INDEX ql503_messages_tenant_recent ON public.ql503_delivery_messages
 (source_app,tenant_digest,recorded_at DESC);

CREATE TABLE public.ql503_delivery_evidence (
  source_app text NOT NULL,
  tenant_digest char(64) NOT NULL,
  thread_digest char(64) NOT NULL,
  message_key text NOT NULL,
  message_version integer NOT NULL,
  event_id text NOT NULL CHECK (event_id ~ '^[A-Za-z0-9_-]{8,96}$'),
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('PROVIDER_ACCEPTED','PROVIDER_DELIVERED','INBOUND_REPLY')),
  evidence_packet_digest char(64) NOT NULL CHECK (evidence_packet_digest ~ '^[a-f0-9]{64}$'),
  provider_receipt_id text CHECK (provider_receipt_id IS NULL OR provider_receipt_id ~ '^[A-Za-z0-9_-]{8,96}$'),
  signed_by text NOT NULL CHECK (signed_by IN ('ORIGINAL_SOURCE','INDEPENDENT_PROVIDER')),
  reply_current_version integer,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_app,tenant_digest,event_id),
  FOREIGN KEY (source_app,tenant_digest,thread_digest,message_key,message_version)
    REFERENCES public.ql503_delivery_messages
      (source_app,tenant_digest,thread_digest,message_key,message_version)
    ON DELETE RESTRICT,
  CHECK (
    (evidence_kind IN ('PROVIDER_ACCEPTED','PROVIDER_DELIVERED')
      AND signed_by='INDEPENDENT_PROVIDER'
      AND provider_receipt_id IS NOT NULL AND reply_current_version IS NULL)
    OR
    (evidence_kind='INBOUND_REPLY' AND signed_by='ORIGINAL_SOURCE'
      AND provider_receipt_id IS NULL
      AND reply_current_version>message_version)
  )
);
CREATE UNIQUE INDEX ql503_provider_receipt_unique
  ON public.ql503_delivery_evidence (source_app,tenant_digest,provider_receipt_id)
  WHERE provider_receipt_id IS NOT NULL;
CREATE INDEX ql503_evidence_thread_recent
  ON public.ql503_delivery_evidence
  (source_app,tenant_digest,thread_digest,message_key,message_version,occurred_at);

-- Append only. Metadata cannot be silently rewritten to manufacture delivery.
CREATE FUNCTION master_private.ql503_reject_record_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  RAISE EXCEPTION 'QL503_APPEND_ONLY_EVIDENCE_REQUIRES_NEW_SIGNED_RECORD';
END $$;
CREATE TRIGGER ql503_immutable_messages BEFORE UPDATE OR DELETE
  ON public.ql503_delivery_messages FOR EACH ROW
  EXECUTE FUNCTION master_private.ql503_reject_record_changes();
CREATE TRIGGER ql503_immutable_evidence BEFORE UPDATE OR DELETE
  ON public.ql503_delivery_evidence FOR EACH ROW
  EXECUTE FUNCTION master_private.ql503_reject_record_changes();

-- Provider delivered claims cannot predate an accepted receipt for the
-- same exact tenant, thread, message ID and immutable version.
CREATE FUNCTION master_private.ql503_ordered_signed_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF NEW.evidence_kind='PROVIDER_DELIVERED' AND NOT EXISTS (
    SELECT 1 FROM public.ql503_delivery_evidence a
    WHERE a.source_app=NEW.source_app AND a.tenant_digest=NEW.tenant_digest
      AND a.thread_digest=NEW.thread_digest AND a.message_key=NEW.message_key
      AND a.message_version=NEW.message_version
      AND a.evidence_kind='PROVIDER_ACCEPTED' AND a.occurred_at<=NEW.occurred_at
  ) THEN
    RAISE EXCEPTION 'QL503_DELIVERED_CLAIM_REQUIRES_PRIOR_ACCEPTED_RECEIPT';
  END IF;
  IF NEW.evidence_kind='INBOUND_REPLY' AND NOT EXISTS (
    SELECT 1 FROM public.ql503_delivery_messages m
    WHERE m.source_app=NEW.source_app AND m.tenant_digest=NEW.tenant_digest
      AND m.thread_digest=NEW.thread_digest AND m.message_key=NEW.message_key
      AND m.message_version=NEW.reply_current_version
  ) THEN
    RAISE EXCEPTION 'QL503_SUPERSEDED_REPLY_REQUIRES_ACTUAL_NEW_VERSION';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ql503_validate_evidence_order BEFORE INSERT
  ON public.ql503_delivery_evidence FOR EACH ROW
  EXECUTE FUNCTION master_private.ql503_ordered_signed_evidence();

-- Public schema is API-exposed. All rows require a real authenticated member
-- with a still-valid, separately source-approved exact tenant grant.
ALTER TABLE public.ql503_tenant_read_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ql503_tenant_read_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ql503_delivery_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ql503_delivery_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ql503_delivery_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ql503_delivery_evidence FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ql503_tenant_read_grants, public.ql503_delivery_messages,
  public.ql503_delivery_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT (source_app,tenant_digest,user_id,access_role,active,expires_at)
  ON public.ql503_tenant_read_grants TO authenticated;
GRANT SELECT (source_app,tenant_digest,thread_digest,message_key,message_version,
  content_digest,source_packet_digest,issued_at,recorded_at)
  ON public.ql503_delivery_messages TO authenticated;
GRANT SELECT (source_app,tenant_digest,thread_digest,message_key,message_version,
  event_id,evidence_kind,evidence_packet_digest,provider_receipt_id,signed_by,
  reply_current_version,occurred_at,recorded_at)
  ON public.ql503_delivery_evidence TO authenticated;

CREATE POLICY ql503_grant_self_read ON public.ql503_tenant_read_grants
  FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) AND active AND expires_at>now());
CREATE POLICY ql503_exact_tenant_message_read ON public.ql503_delivery_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ql503_tenant_read_grants g
    WHERE g.user_id=(SELECT auth.uid()) AND g.source_app=ql503_delivery_messages.source_app
      AND g.tenant_digest=ql503_delivery_messages.tenant_digest
      AND g.active AND g.expires_at>now()
  ));
CREATE POLICY ql503_exact_tenant_evidence_read ON public.ql503_delivery_evidence
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ql503_tenant_read_grants g
    WHERE g.user_id=(SELECT auth.uid()) AND g.source_app=ql503_delivery_evidence.source_app
      AND g.tenant_digest=ql503_delivery_evidence.tenant_digest
      AND g.active AND g.expires_at>now()
  ));

-- Service-role-only atomic import. The separately deployed, owner-approved
-- verifier MUST validate Ed25519 source/provider signatures BEFORE invoking.
-- This is not a public message send endpoint and grants no customer authority.
CREATE FUNCTION public.ql503_record_verified_delivery(
  p_source_app text,p_tenant_digest text,p_thread_digest text,
  p_message_key text,p_message_version integer,p_content_digest text,
  p_source_packet_digest text,p_issued_at timestamptz,p_events jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  v_event jsonb;
  v_kind text; v_id text; v_packet text; v_receipt text; v_at timestamptz;
  v_version integer; v_signer text;
  v_message public.ql503_delivery_messages%ROWTYPE;
  v_existing public.ql503_delivery_evidence%ROWTYPE;
  v_inserted integer:=0;
BEGIN
  IF p_source_app NOT IN ('icamp','yw','devilndove','rosiedazzlers')
    OR p_tenant_digest !~ '^[a-f0-9]{64}$'
    OR p_thread_digest !~ '^[a-f0-9]{64}$'
    OR p_message_key !~ '^[A-Za-z0-9_-]{8,96}$'
    OR p_message_version NOT BETWEEN 1 AND 1000000
    OR p_content_digest !~ '^[a-f0-9]{64}$'
    OR p_source_packet_digest !~ '^[a-f0-9]{64}$'
    OR p_issued_at IS NULL OR p_issued_at>clock_timestamp()
    OR jsonb_typeof(p_events) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_events)>3 THEN
    RAISE EXCEPTION 'QL503_INVALID_SOURCE_SCOPED_SIGNED_IMPORT';
  END IF;
  INSERT INTO public.ql503_delivery_messages
    (source_app,tenant_digest,thread_digest,message_key,message_version,
     content_digest,source_packet_digest,issued_at)
  VALUES (p_source_app,p_tenant_digest,p_thread_digest,p_message_key,
    p_message_version,p_content_digest,p_source_packet_digest,p_issued_at)
  ON CONFLICT DO NOTHING;
  SELECT * INTO v_message FROM public.ql503_delivery_messages
  WHERE source_app=p_source_app AND tenant_digest=p_tenant_digest
    AND thread_digest=p_thread_digest AND message_key=p_message_key
    AND message_version=p_message_version;
  IF NOT FOUND OR v_message.content_digest<>p_content_digest
    OR v_message.source_packet_digest<>p_source_packet_digest
    OR v_message.issued_at<>p_issued_at THEN
    RAISE EXCEPTION 'QL503_CONFLICTING_IMMUTABLE_MESSAGE_VERSION';
  END IF;
  FOR v_event IN SELECT value FROM jsonb_array_elements(p_events) LOOP
    IF jsonb_typeof(v_event)<>'object' OR
      (SELECT count(*) FROM jsonb_object_keys(v_event))<>7 THEN
      RAISE EXCEPTION 'QL503_UNKNOWN_EVENT_FIELDS';
    END IF;
    v_kind:=v_event->>'kind';v_id:=v_event->>'id';
    v_packet:=v_event->>'digest';v_receipt:=v_event->>'receipt';
    v_signer:=v_event->>'signer';v_version:=(v_event->>'currentVersion')::integer;
    v_at:=(v_event->>'occurredAt')::timestamptz;
    IF v_at IS NULL OR v_at>clock_timestamp()+interval '60 seconds'
      OR v_at<p_issued_at OR v_packet !~ '^[a-f0-9]{64}$'
      OR v_id !~ '^[A-Za-z0-9_-]{8,96}$' THEN
      RAISE EXCEPTION 'QL503_INVALID_EVIDENCE_TIMESTAMP_OR_DIGEST';
    END IF;
    INSERT INTO public.ql503_delivery_evidence
      (source_app,tenant_digest,thread_digest,message_key,message_version,
       event_id,evidence_kind,evidence_packet_digest,provider_receipt_id,
       signed_by,reply_current_version,occurred_at)
    VALUES (p_source_app,p_tenant_digest,p_thread_digest,p_message_key,p_message_version,
      v_id,v_kind,v_packet,v_receipt,v_signer,v_version,v_at)
    ON CONFLICT (source_app,tenant_digest,event_id) DO NOTHING;
    SELECT * INTO v_existing FROM public.ql503_delivery_evidence
    WHERE source_app=p_source_app AND tenant_digest=p_tenant_digest AND event_id=v_id;
    IF NOT FOUND OR v_existing.thread_digest<>p_thread_digest
      OR v_existing.message_key<>p_message_key OR
      v_existing.message_version<>p_message_version OR
      v_existing.evidence_kind<>v_kind OR v_existing.evidence_packet_digest<>v_packet OR
      v_existing.provider_receipt_id IS DISTINCT FROM v_receipt OR
      v_existing.signed_by<>v_signer OR
      v_existing.reply_current_version IS DISTINCT FROM v_version OR
      v_existing.occurred_at<>v_at THEN
      RAISE EXCEPTION 'QL503_CONFLICTING_OR_REPLAYED_PROVIDER_EVIDENCE';
    END IF;
    v_inserted:=v_inserted+1;
  END LOOP;
  RETURN pg_catalog.jsonb_build_object('state','DURABLE_METADATA_REVIEW_HELD',
    'messageKey',p_message_key,'version',p_message_version,
    'evidenceReviewed',v_inserted,'humanAcknowledged',false,
    'liveNetworkObservedByDatabase',false,'customerWrites',false);
END $$;
REVOKE ALL ON FUNCTION public.ql503_record_verified_delivery(
  text,text,text,text,integer,text,text,timestamptz,jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ql503_record_verified_delivery(
  text,text,text,text,integer,text,text,timestamptz,jsonb)
  TO service_role;
-- Zero initial records and ZERO tenant grants. All code paths default HOLD.
