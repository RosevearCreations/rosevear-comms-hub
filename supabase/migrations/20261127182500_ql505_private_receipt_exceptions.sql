-- QL-505: Comms-only immutable receipt exceptions; no external provider activation.
-- The read surface is tenant-scoped and cannot create/source-approve grants.
CREATE TABLE public.ql505_receipt_exceptions (
 source_app text NOT NULL CHECK (source_app IN ('icamp','yw','devilndove','rosiedazzlers')),
 tenant_digest char(64) NOT NULL CHECK (tenant_digest ~ '^[a-f0-9]{64}$'),
 exception_id char(64) NOT NULL CHECK (exception_id ~ '^[a-f0-9]{64}$'),
 job_digest char(64) NOT NULL CHECK (job_digest ~ '^[a-f0-9]{64}$'),
 packet_digest char(64) NOT NULL CHECK (packet_digest ~ '^[a-f0-9]{64}$'),
 reason_code text NOT NULL CHECK (reason_code IN
  ('PRIVATE_RPC_UNAVAILABLE','PIN_EXPIRED_OR_REVOKED',
   'PRIVATE_JOURNAL_HOLD','IMMUTABLE_CONFLICT','FIELD_REVIEW_UNVERIFIED')),
 status text NOT NULL DEFAULT 'HOLD' CHECK (status='HOLD'),
 origin text NOT NULL DEFAULT 'COMMS_PRIVATE_WORKER'
  CHECK (origin='COMMS_PRIVATE_WORKER'),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (source_app,tenant_digest,exception_id)
);
CREATE INDEX ql505_exception_tenant_recent ON public.ql505_receipt_exceptions
 (source_app,tenant_digest,recorded_at DESC);
COMMENT ON TABLE public.ql505_receipt_exceptions IS
 'Metadata-only Comms private receipt exceptions, append-only; HOLD never asserts provider delivery or physical host witness.';
CREATE TRIGGER ql505_immutable_receipt_exception BEFORE UPDATE OR DELETE
 ON public.ql505_receipt_exceptions FOR EACH ROW
 EXECUTE FUNCTION master_private.ql503_reject_record_changes();
ALTER TABLE public.ql505_receipt_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ql505_receipt_exceptions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ql505_receipt_exceptions FROM PUBLIC, anon, authenticated;
GRANT SELECT (source_app,tenant_digest,exception_id,job_digest,reason_code,status,recorded_at)
 ON public.ql505_receipt_exceptions TO authenticated;
CREATE POLICY ql505_exact_source_approved_tenant_read
 ON public.ql505_receipt_exceptions FOR SELECT TO authenticated USING (
 EXISTS (
  SELECT 1 FROM public.ql503_tenant_read_grants g
  WHERE g.user_id=(SELECT auth.uid())
   AND g.source_app=ql505_receipt_exceptions.source_app
   AND g.tenant_digest=ql505_receipt_exceptions.tenant_digest
   AND g.active AND g.expires_at>now()
 )
);
-- The signer verification, original-host gates and authentic server-role
-- authority are enforced by the separately deployed Comms-only private process.
CREATE FUNCTION public.ql505_record_receipt_exception(
 p_source_app text,p_tenant_digest text,p_exception_id text,
 p_job_digest text,p_packet_digest text,p_reason_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 v public.ql505_receipt_exceptions%ROWTYPE;
BEGIN
 IF p_source_app IS NULL OR p_source_app NOT IN ('icamp','yw','devilndove','rosiedazzlers')
 OR p_tenant_digest IS NULL OR p_tenant_digest !~ '^[a-f0-9]{64}$'
 OR p_exception_id IS NULL OR p_exception_id !~ '^[a-f0-9]{64}$'
 OR p_job_digest IS NULL OR p_job_digest !~ '^[a-f0-9]{64}$'
 OR p_packet_digest IS NULL OR p_packet_digest !~ '^[a-f0-9]{64}$'
 OR p_reason_code IS NULL OR p_reason_code NOT IN (
  'PRIVATE_RPC_UNAVAILABLE','PIN_EXPIRED_OR_REVOKED',
  'PRIVATE_JOURNAL_HOLD','IMMUTABLE_CONFLICT','FIELD_REVIEW_UNVERIFIED')
 THEN RAISE EXCEPTION 'QL505_INVALID_PRIVATE_EXCEPTION_METADATA';
 END IF;
 INSERT INTO public.ql505_receipt_exceptions
  (source_app,tenant_digest,exception_id,job_digest,packet_digest,reason_code)
 VALUES
  (p_source_app,p_tenant_digest,p_exception_id,p_job_digest,p_packet_digest,p_reason_code)
 ON CONFLICT (source_app,tenant_digest,exception_id) DO NOTHING;
 SELECT * INTO v FROM public.ql505_receipt_exceptions
  WHERE source_app=p_source_app AND tenant_digest=p_tenant_digest
   AND exception_id=p_exception_id;
 IF NOT FOUND OR v.job_digest<>p_job_digest OR
    v.packet_digest<>p_packet_digest OR v.reason_code<>p_reason_code OR
    v.status<>'HOLD' OR v.origin<>'COMMS_PRIVATE_WORKER'
 THEN RAISE EXCEPTION 'QL505_EXCEPTION_REPLAY_CONFLICT';
 END IF;
 RETURN pg_catalog.jsonb_build_object(
  'state','QL505_PRIVATE_EXCEPTION_DURABLE_HOLD',
  'exceptionId',p_exception_id,'reason',p_reason_code,
  'externalDeliveryObserved',false,'humanAcknowledged',false,'autoSend',false
 );
END $$;
REVOKE ALL ON FUNCTION public.ql505_record_receipt_exception(
 text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ql505_record_receipt_exception(
 text,text,text,text,text,text) TO service_role;
-- Never seed grants, test exceptions, production evidence, provider keys or PII.
