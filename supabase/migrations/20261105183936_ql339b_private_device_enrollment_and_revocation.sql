-- QL-339B: independently signed, nonsecret Windows device public-key enrollments.
-- Public/API clients must never enroll, approve or revoke a device. The server
-- separately validates both original owner signatures and the physical witnesses.
CREATE TABLE public.master_hub_device_enrollments_ql339b (
  enrollment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL CHECK (device_id ~ '^[a-z0-9][a-z0-9._:-]{1,63}$'),
  workload_id text NOT NULL CHECK (workload_id ~ '^[a-z0-9][a-z0-9._:-]{1,63}$'),
  key_id text NOT NULL CHECK (key_id ~ '^[a-z0-9][a-z0-9._:-]{1,63}$'),
  enrollment_state text NOT NULL CHECK (enrollment_state='REVIEWED_TEST'),
  enrollment_record jsonb NOT NULL CHECK (jsonb_typeof(enrollment_record)='object'
    AND octet_length(enrollment_record::text)<8192),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql339b_one_device_workload_key UNIQUE (device_id,workload_id,key_id)
);
CREATE TABLE public.master_hub_device_revocations_ql339b (
  revocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  workload_id text NOT NULL,
  key_id text NOT NULL,
  reason_code text NOT NULL CHECK (reason_code IN ('OWNER_REVOKED','DEVICE_LOST',
    'ROTATED','COMPROMISE_SUSPECTED','PILOT_EXPIRED')),
  revoked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ql339b_one_device_revocation UNIQUE (device_id,workload_id,key_id),
  CONSTRAINT ql339b_revocation_known_enrollment FOREIGN KEY(device_id,workload_id,key_id)
    REFERENCES public.master_hub_device_enrollments_ql339b(device_id,workload_id,key_id)
);
CREATE INDEX ql339b_enrollment_created ON public.master_hub_device_enrollments_ql339b(created_at DESC);
ALTER TABLE public.master_hub_device_enrollments_ql339b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_hub_device_enrollments_ql339b FORCE ROW LEVEL SECURITY;
ALTER TABLE public.master_hub_device_revocations_ql339b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_hub_device_revocations_ql339b FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_hub_device_enrollments_ql339b FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON public.master_hub_device_revocations_ql339b FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.master_hub_device_enrollments_ql339b TO service_role;
GRANT SELECT ON public.master_hub_device_revocations_ql339b TO service_role;
CREATE TRIGGER ql339b_enrollments_append_only BEFORE UPDATE OR DELETE
  ON public.master_hub_device_enrollments_ql339b FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
CREATE TRIGGER ql339b_revocations_append_only BEFORE UPDATE OR DELETE
  ON public.master_hub_device_revocations_ql339b FOR EACH ROW
  EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
