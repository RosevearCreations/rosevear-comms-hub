-- QL-340C: private, TEST-only Windows receiver. No login or password is
-- created by this migration. An independent owner must provision credentials.
-- Never grant these permissions to anon, authenticated, or browser clients.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ql340c_private_receiver') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ql340c_private_receiver'
      AND (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb OR rolcreaterole
        OR rolreplication OR rolbypassrls)) THEN
      RAISE EXCEPTION 'HOLD_EXISTING_RECEIVER_ROLE_NOT_LEAST_PRIVILEGE';
    END IF;
  ELSE
    CREATE ROLE ql340c_private_receiver NOLOGIN NOINHERIT NOSUPERUSER
      NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ql340c_private_receiver;
GRANT SELECT ON public.master_hub_device_enrollments_ql339b TO ql340c_private_receiver;
GRANT SELECT ON public.master_hub_device_revocations_ql339b TO ql340c_private_receiver;
GRANT INSERT (device_id,workload_id,session_id,sequence_no,nonce,heartbeat_sha256,queue_depth),
  SELECT (receipt_id) ON public.master_hub_relay_receipts_ql338 TO ql340c_private_receiver;

CREATE POLICY ql340c_exact_test_enrollment_read
  ON public.master_hub_device_enrollments_ql339b
  FOR SELECT TO ql340c_private_receiver
  USING (device_id='rosevear-windows-hub' AND workload_id='hub-probe'
    AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST');
CREATE POLICY ql340c_exact_test_revocation_read
  ON public.master_hub_device_revocations_ql339b
  FOR SELECT TO ql340c_private_receiver
  USING (device_id='rosevear-windows-hub' AND workload_id='hub-probe'
    AND key_id='hub-ql339b');
CREATE POLICY ql340c_exact_held_receipt_insert
  ON public.master_hub_relay_receipts_ql338
  FOR INSERT TO ql340c_private_receiver
  WITH CHECK (source_app_id='rosevear-ai-hub'
    AND device_id='rosevear-windows-hub' AND workload_id='hub-probe'
    AND connection_state='HOLD');
-- INSERT ... RETURNING receipt_id needs SELECT privilege and a matching RLS
-- visibility policy. No other receipt columns may be read by this role.
CREATE POLICY ql340c_exact_held_receipt_id_read
  ON public.master_hub_relay_receipts_ql338
  FOR SELECT TO ql340c_private_receiver
  USING (source_app_id='rosevear-ai-hub'
    AND device_id='rosevear-windows-hub' AND workload_id='hub-probe'
    AND connection_state='HOLD');

COMMENT ON ROLE ql340c_private_receiver IS
  'QL-340C, NOLOGIN until separately owner-authorized; scoped to TEST readback and append-only HOLD receipt';
