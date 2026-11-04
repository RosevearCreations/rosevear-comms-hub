-- QL-334: real private procedure state and safe scheduler metadata.
-- No owner/peer credentials are installed; every source is HELD.
-- The public Cloudflare/Vite client has zero Data API access to these tables.

CREATE TABLE public.master_procedure_versions (
  procedure_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  procedure_code text NOT NULL CHECK (procedure_code IN ('connect_readonly','client_portal_tracking','management_reporting')),
  revision integer NOT NULL CHECK (revision BETWEEN 1 AND 10000),
  parent_revision integer CHECK (parent_revision IS NULL OR parent_revision > 0),
  optimistic_version integer NOT NULL DEFAULT 1 CHECK (optimistic_version > 0),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEWED','APPROVED','ACTIVE','REVOKED')),
  core_steps jsonb NOT NULL CHECK (
    jsonb_typeof(core_steps)='array' AND jsonb_array_length(core_steps) BETWEEN 8 AND 18
    AND core_steps @> '["DISCOVER","VERIFY_SOURCE","VERIFY_OWNER","RESOLVE_VAULT_HANDLE","READONLY_TEST","VERIFY_RECEIPT","MONITOR","HOLD"]'::jsonb
    AND core_steps <@ '["DISCOVER","VERIFY_SOURCE","VERIFY_OWNER","RESOLVE_VAULT_HANDLE","READONLY_TEST","VERIFY_RECEIPT","MONITOR","HOLD","REVIEW_FOLLOWUP","CHECK_FRESHNESS","MEASURE_LATENCY"]'::jsonb
  ),
  config_sha256 char(64) NOT NULL CHECK (config_sha256 ~ '^[a-f0-9]{64}$'),
  system_seed boolean NOT NULL DEFAULT false,
  author_user_id uuid REFERENCES public.master_principals(user_id) ON DELETE RESTRICT,
  reviewer_user_id uuid REFERENCES public.master_principals(user_id) ON DELETE RESTRICT,
  reviewer_receipt_sha256 char(64) CHECK (reviewer_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  source_authorization_sha256 char(64) CHECK (source_authorization_sha256 ~ '^[a-f0-9]{64}$'),
  owner_authorization_sha256 char(64) CHECK (owner_authorization_sha256 ~ '^[a-f0-9]{64}$'),
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shell_id,procedure_code,revision),
  UNIQUE (shell_id,procedure_version_id),
  CHECK (parent_revision IS NULL OR parent_revision < revision),
  CHECK (NOT system_seed OR (status='DRAFT' AND author_user_id IS NULL AND reviewer_user_id IS NULL)),
  CHECK (system_seed OR author_user_id IS NOT NULL),
  CHECK (status='DRAFT' OR (
    NOT system_seed AND reviewer_user_id IS NOT NULL AND reviewer_user_id <> author_user_id
    AND reviewer_receipt_sha256 IS NOT NULL
  )),
  CHECK (status NOT IN ('APPROVED','ACTIVE') OR owner_authorization_sha256 IS NOT NULL),
  CHECK (status <> 'ACTIVE' OR (source_authorization_sha256 IS NOT NULL AND activated_at IS NOT NULL))
);
CREATE UNIQUE INDEX master_procedure_one_active_per_code
  ON public.master_procedure_versions(shell_id,procedure_code) WHERE status='ACTIVE';
CREATE INDEX master_procedure_author_fk ON public.master_procedure_versions(author_user_id);
CREATE INDEX master_procedure_reviewer_fk ON public.master_procedure_versions(reviewer_user_id);

CREATE TABLE public.master_procedure_decisions (
  decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL,
  procedure_version_id uuid NOT NULL,
  actor_user_id uuid REFERENCES public.master_principals(user_id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('DRAFT_CREATED','REVIEW_REQUESTED','REVIEW_ACCEPTED','APPROVED','ACTIVATED','REVOKED','DENIED')),
  source text NOT NULL CHECK (source IN ('HUMAN_MASTER','TRUSTED_BROKER','SYSTEM_SEED')),
  receipt_sha256 char(64) NOT NULL CHECK (receipt_sha256 ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,procedure_version_id)
    REFERENCES public.master_procedure_versions(shell_id,procedure_version_id) ON DELETE RESTRICT,
  UNIQUE (shell_id,receipt_sha256),
  CHECK (source='SYSTEM_SEED' OR actor_user_id IS NOT NULL)
);
CREATE INDEX master_procedure_decisions_version_fk ON public.master_procedure_decisions(shell_id,procedure_version_id);
CREATE INDEX master_procedure_decisions_actor_fk ON public.master_procedure_decisions(actor_user_id);

CREATE TABLE public.master_procedure_schedules (
  shell_id text PRIMARY KEY REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  interval_seconds integer NOT NULL DEFAULT 21600 CHECK (interval_seconds BETWEEN 900 AND 604800),
  next_due_at timestamptz,
  enabled boolean NOT NULL DEFAULT false,
  verified_workload_id uuid REFERENCES public.master_workload_identities(workload_id) ON DELETE RESTRICT,
  last_tick_at timestamptz,
  CHECK (NOT enabled OR verified_workload_id IS NOT NULL)
);
CREATE INDEX master_procedure_schedules_workload_fk ON public.master_procedure_schedules(verified_workload_id);

CREATE TABLE public.master_procedure_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL,
  procedure_version_id uuid NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('PUBLIC_DISCOVERY','SIGNED_READONLY_TEST')),
  stage text NOT NULL DEFAULT 'DISCOVER' CHECK (stage IN ('DISCOVER','VERIFY_SOURCE','VERIFY_OWNER','RESOLVE_VAULT_HANDLE','READONLY_TEST','VERIFY_RECEIPT','MONITOR','HOLD')),
  state text NOT NULL DEFAULT 'QUEUED' CHECK (state IN ('QUEUED','CLAIMED','RETRY','HOLD','COMPLETED','DEAD_LETTER','CANCELLED')),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9._:-]{12,128}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_sha256 char(64) CHECK (lease_sha256 ~ '^[a-f0-9]{64}$'),
  lease_until timestamptz,
  workload_id uuid REFERENCES public.master_workload_identities(workload_id) ON DELETE RESTRICT,
  last_http_status integer CHECK (last_http_status BETWEEN 100 AND 599),
  failure_code text CHECK (failure_code ~ '^[A-Z0-9_]{3,70}$'),
  source_owner_receipt_sha256 char(64) CHECK (source_owner_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  owner_test_receipt_sha256 char(64) CHECK (owner_test_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,procedure_version_id)
    REFERENCES public.master_procedure_versions(shell_id,procedure_version_id) ON DELETE RESTRICT,
  UNIQUE (shell_id,job_type,idempotency_key),
  UNIQUE (shell_id,job_id),
  CHECK (state<>'CLAIMED' OR (lease_sha256 IS NOT NULL AND lease_until IS NOT NULL AND workload_id IS NOT NULL)),
  CHECK (job_type<>'SIGNED_READONLY_TEST' OR (source_owner_receipt_sha256 IS NOT NULL AND owner_test_receipt_sha256 IS NOT NULL))
);
CREATE INDEX master_procedure_jobs_due ON public.master_procedure_jobs(state,next_attempt_at);
CREATE INDEX master_procedure_jobs_version_fk ON public.master_procedure_jobs(shell_id,procedure_version_id);
CREATE INDEX master_procedure_jobs_workload_fk ON public.master_procedure_jobs(workload_id);

CREATE TABLE public.master_procedure_job_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL,
  job_id uuid NOT NULL,
  event_code text NOT NULL CHECK (event_code ~ '^[A-Z0-9_]{3,70}$'),
  receipt_sha256 char(64) NOT NULL CHECK (receipt_sha256 ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shell_id,job_id) REFERENCES public.master_procedure_jobs(shell_id,job_id) ON DELETE RESTRICT,
  UNIQUE (shell_id,job_id,event_code,receipt_sha256)
);
CREATE INDEX master_procedure_job_events_job_fk ON public.master_procedure_job_events(shell_id,job_id);

CREATE TABLE public.master_procedure_breakers (
  shell_id text PRIMARY KEY REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'CLOSED' CHECK (state IN ('CLOSED','OPEN','HALF_OPEN')),
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures BETWEEN 0 AND 1000),
  opened_at timestamptz,
  retry_after timestamptz,
  CHECK (state<>'OPEN' OR (opened_at IS NOT NULL AND retry_after>opened_at))
);

CREATE TABLE public.master_procedure_connection_links (
  shell_id text PRIMARY KEY REFERENCES public.master_shell_registry(shell_id) ON DELETE RESTRICT,
  source_repository text NOT NULL CHECK (source_repository ~ '^RosevearCreations/[a-zA-Z0-9-]+$'),
  manifest_path text NOT NULL DEFAULT '/.well-known/rosevear-integration-manifest.json'
    CHECK (manifest_path='/.well-known/rosevear-integration-manifest.json'),
  control_plane_url text NOT NULL DEFAULT 'https://rosevear-comms-hub.devilndovelive.workers.dev/'
    CHECK (control_plane_url='https://rosevear-comms-hub.devilndovelive.workers.dev/'),
  public_app_url text CHECK (public_app_url IS NULL OR public_app_url ~ '^https://[a-z0-9.-]+/$'),
  discovery_state text NOT NULL DEFAULT 'PUBLIC_MANIFEST_LINK_ONLY'
    CHECK (discovery_state IN ('PUBLIC_MANIFEST_LINK_ONLY','PUBLIC_DIGEST_OBSERVED','QUARANTINED')),
  private_connection_state text NOT NULL DEFAULT 'DISCONNECTED / HOLD'
    CHECK (private_connection_state='DISCONNECTED / HOLD'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Private data-plane boundary: no browser or authenticated user may bypass a
-- server-authorized broker through PostgREST. RLS is enabled even for service use.
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'master_procedure_versions','master_procedure_decisions','master_procedure_schedules',
    'master_procedure_jobs','master_procedure_job_events','master_procedure_breakers',
    'master_procedure_connection_links'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated',t);
  END LOOP;
END $$;

-- Append-only provenance cannot be overwritten, even accidentally by private roles.
CREATE FUNCTION public.ql334_reject_evidence_mutation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'QL334_APPEND_ONLY_EVIDENCE';
END $$;
REVOKE ALL ON FUNCTION public.ql334_reject_evidence_mutation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ql334_decisions_append_only BEFORE UPDATE OR DELETE
  ON public.master_procedure_decisions FOR EACH ROW EXECUTE FUNCTION public.ql334_reject_evidence_mutation();
CREATE TRIGGER ql334_job_events_append_only BEFORE UPDATE OR DELETE
  ON public.master_procedure_job_events FOR EACH ROW EXECUTE FUNCTION public.ql334_reject_evidence_mutation();

-- Six systems get a discoverable PRIVATE database profile; all automation disabled.
INSERT INTO public.master_procedure_schedules(shell_id)
SELECT shell_id FROM public.master_shell_registry;
INSERT INTO public.master_procedure_breakers(shell_id)
SELECT shell_id FROM public.master_shell_registry;
INSERT INTO public.master_procedure_connection_links(shell_id,source_repository,public_app_url)
SELECT shell_id,source_repository,CASE shell_id
  WHEN 'yw' THEN 'https://yw-alpha.vercel.app/'
  WHEN 'icamp' THEN 'https://i-camp-pi.vercel.app/'
  WHEN 'ai-data-platform' THEN 'https://ai-data-platform-beryl.vercel.app/'
  ELSE NULL END
FROM public.master_shell_registry;

-- Only audited DRAFT templates; never fabricate an author or approval receipt.
INSERT INTO public.master_procedure_versions(
  shell_id,procedure_code,revision,core_steps,config_sha256,system_seed)
SELECT shell_id,procedure_code,1,
  '["DISCOVER","VERIFY_SOURCE","VERIFY_OWNER","RESOLVE_VAULT_HANDLE","READONLY_TEST","VERIFY_RECEIPT","MONITOR","HOLD"]'::jsonb,
  encode(sha256((shell_id||':'||procedure_code||':ql334-draft-v1')::bytea),'hex'),true
FROM public.master_shell_registry
CROSS JOIN (VALUES ('connect_readonly'),('client_portal_tracking'),('management_reporting')) AS p(procedure_code);

COMMENT ON TABLE public.master_procedure_versions IS 'Server-only versioned procedure drafts; author/reviewer separation and original proof required to activate.';
COMMENT ON TABLE public.master_procedure_jobs IS 'Durable bounded scheduler queue, disabled until trusted workload and independent source authorization.';
COMMENT ON TABLE public.master_procedure_connection_links IS 'Public nonsecret navigation; not authentication or outbound connection grants.';
