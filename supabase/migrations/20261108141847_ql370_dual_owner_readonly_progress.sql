-- QL-370: read-only, explicitly AAL2-gated progress for the two original
-- owners. No writes, enrollment changes, session issuance or connection grants.
-- Only service_role may execute; the Edge Function separately verifies the
-- requesting owner's current JWT and binds user_id/session_id from claims.
CREATE FUNCTION public.ql370_get_original_owner_progress(
  p_user_id uuid, p_session_id uuid, p_intent_sha256 text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_role text;
  v_principal_active boolean;
  v_membership_active boolean;
  v_organization_state text;
  v_self master_private.ql369_owner_mfa_attestations%ROWTYPE;
  v_peer master_private.ql369_owner_mfa_attestations%ROWTYPE;
  v_self_current boolean := false;
  v_peer_current boolean := false;
  v_self_state text := 'NOT_RECORDED';
  v_peer_state text := 'NOT_RECORDED';
  v_owner_count integer;
  v_active_count integer;
  v_shell_count integer;
  v_held_count integer;
  v_receipt_at timestamptz;
  v_audit_count integer;
  v_last_audit timestamptz;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_user_id IS NULL OR p_session_id IS NULL OR
    (p_intent_sha256 IS NOT NULL AND
      (p_intent_sha256 !~ '^[a-f0-9]{64}$' OR p_intent_sha256=repeat('0',64))) THEN
    RAISE EXCEPTION 'DENY_QL370_MALFORMED_AUTHENTICATED_PROGRESS_REQUEST';
  END IF;

  -- Neither email, user_metadata nor caller-supplied owner_role is authority.
  SELECT m.owner_role,p.active,m.active INTO STRICT
    v_role,v_principal_active,v_membership_active
  FROM public.master_organization_owner_memberships m
  JOIN public.master_principals p ON p.user_id=m.user_id
  JOIN public.master_organizations o ON o.organization_id=m.organization_id
  WHERE m.organization_id='rosevear-creations' AND m.user_id=p_user_id
    AND p.master_role='owner'
    AND ((m.owner_role='source' AND m.user_id='69f496bc-ee9d-4bdb-8022-0d5620a11b09'::uuid)
      OR (m.owner_role='master' AND m.user_id='f8118088-01ee-4701-9f34-1480ec33723f'::uuid));

  IF NOT EXISTS (
    SELECT 1 FROM auth.sessions s
    JOIN auth.mfa_factors f ON f.id=s.factor_id AND f.user_id=s.user_id
    JOIN auth.users u ON u.id=s.user_id
    WHERE s.id=p_session_id AND s.user_id=p_user_id AND s.aal::text='aal2'
      AND (s.not_after IS NULL OR s.not_after>v_now)
      AND f.factor_type::text='totp' AND f.status::text='verified'
      AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
      AND u.is_anonymous IS NOT TRUE
      AND (u.banned_until IS NULL OR u.banned_until<v_now)
  ) THEN RAISE EXCEPTION 'DENY_QL370_CURRENT_VERIFIED_OWNER_AAL2_REQUIRED'; END IF;

  SELECT count(*) INTO v_owner_count FROM public.master_organization_owner_memberships
    WHERE organization_id='rosevear-creations';
  IF v_owner_count<>2 OR (SELECT count(*) FROM public.master_principals)<>2 THEN
    RAISE EXCEPTION 'DENY_QL370_UNEXPECTED_OWNER_OR_PRINCIPAL';
  END IF;

  SELECT enrollment_state INTO STRICT v_organization_state
    FROM public.master_organizations WHERE organization_id='rosevear-creations';
  SELECT count(*) INTO v_active_count
    FROM public.master_organization_owner_memberships
    WHERE organization_id='rosevear-creations' AND active;
  SELECT count(*) INTO v_shell_count
    FROM public.master_organization_shells WHERE organization_id='rosevear-creations';
  SELECT count(*) INTO v_held_count
    FROM public.master_organization_shells WHERE organization_id='rosevear-creations'
      AND connection_state='DISCONNECTED / HOLD'
      AND NOT child_tenant_access AND NOT customer_operations;
  SELECT inserted_at INTO v_receipt_at
    FROM master_private.ql369_owner_activation_receipts
    WHERE organization_id='rosevear-creations';

  -- Intent-specific: never reveal a raw digest, peer UUID, factor/session ID,
  -- email, IP or private key. A missing digest returns NOT_RECORDED.
  IF p_intent_sha256 IS NOT NULL THEN
    SELECT * INTO v_self FROM master_private.ql369_owner_mfa_attestations
      WHERE organization_id='rosevear-creations' AND owner_role=v_role
      AND user_id=p_user_id AND intent_sha256=p_intent_sha256;
    SELECT * INTO v_peer FROM master_private.ql369_owner_mfa_attestations
      WHERE organization_id='rosevear-creations' AND owner_role<>v_role
      AND intent_sha256=p_intent_sha256;
    IF v_self.user_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM auth.sessions s JOIN auth.mfa_factors f
          ON f.id=s.factor_id AND f.user_id=s.user_id
        JOIN auth.users u ON u.id=s.user_id
        WHERE s.id=v_self.session_id AND s.user_id=v_self.user_id
          AND s.factor_id=v_self.factor_id AND s.aal::text='aal2'
          AND (s.not_after IS NULL OR s.not_after>v_now)
          AND f.factor_type::text='totp' AND f.status::text='verified'
          AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
          AND u.is_anonymous IS NOT TRUE
          AND (u.banned_until IS NULL OR u.banned_until<v_now)
      ) INTO v_self_current;
      v_self_state := CASE WHEN v_self.expires_at<=v_now THEN 'EXPIRED'
        WHEN v_self_current THEN 'CURRENT' ELSE 'REVOKED_OR_STALE' END;
    END IF;
    IF v_peer.user_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM auth.sessions s JOIN auth.mfa_factors f
          ON f.id=s.factor_id AND f.user_id=s.user_id
        JOIN auth.users u ON u.id=s.user_id
        WHERE s.id=v_peer.session_id AND s.user_id=v_peer.user_id
          AND s.factor_id=v_peer.factor_id AND s.aal::text='aal2'
          AND (s.not_after IS NULL OR s.not_after>v_now)
          AND f.factor_type::text='totp' AND f.status::text='verified'
          AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
          AND u.is_anonymous IS NOT TRUE
          AND (u.banned_until IS NULL OR u.banned_until<v_now)
      ) INTO v_peer_current;
      v_peer_state := CASE WHEN v_peer.expires_at<=v_now THEN 'EXPIRED'
        WHEN v_peer_current THEN 'CURRENT' ELSE 'REVOKED_OR_STALE' END;
    END IF;
  END IF;

  -- Only the final QL-369 activation audit/receipt may appear here. No
  -- disclosure of audit row IDs, receipt SHA bytes or other security events.
  SELECT count(*),max(a.inserted_at) INTO v_audit_count,v_last_audit
  FROM public.master_security_audit a
  JOIN master_private.ql369_owner_activation_receipts r
    ON r.signed_packet_sha256=a.receipt_sha256
  WHERE r.organization_id='rosevear-creations'
    AND a.action_code='QL369_AUTHENTICATED_ORIGINAL_DUAL_OWNER_MEMBERSHIP'
    AND a.actor_user_id='69f496bc-ee9d-4bdb-8022-0d5620a11b09'::uuid;

  RETURN jsonb_build_object(
    'state','ORIGINAL_OWNER_PROGRESS_READ_ONLY',
    'organizationId','rosevear-creations',
    'ownerRole',v_role,
    'sessionAal2Verified',true,
    'ownerMembershipActive',v_membership_active AND v_principal_active,
    'organizationEnrollmentState',v_organization_state,
    'activeOwnerMemberships',v_active_count,
    'ownAttestation',jsonb_build_object('state',v_self_state,
      'expiresAt',CASE WHEN v_self.user_id IS NOT NULL THEN v_self.expires_at ELSE NULL END),
    'peerAttestation',jsonb_build_object('state',v_peer_state,
      'expiresAt',CASE WHEN v_peer.user_id IS NOT NULL THEN v_peer.expires_at ELSE NULL END),
    'offlineApprovalState',CASE WHEN v_receipt_at IS NULL
      THEN 'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION'
      ELSE 'VERIFIED_AT_ORIGINAL_ACTIVATION' END,
    'audit',jsonb_build_object(
      'activationRecorded',v_receipt_at IS NOT NULL,
      'activationAt',v_receipt_at,
      'verifiedActivationEvents',v_audit_count,
      'lastVerifiedEventAt',v_last_audit),
    'heldApplicationShells',v_held_count,
    'totalApplicationShells',v_shell_count,
    'connectionsState',CASE WHEN v_shell_count=6 AND v_held_count=6
      THEN 'DISCONNECTED / HOLD' ELSE 'HOLD_STATE_DRIFT_REQUIRES_REVIEW' END,
    'privateTestAuthorized',false,
    'snapshotAt',v_now
  );
EXCEPTION WHEN no_data_found OR too_many_rows THEN
  RAISE EXCEPTION 'DENY_QL370_ORIGINAL_OWNER_BINDING_REQUIRED';
END; $$;

REVOKE ALL ON FUNCTION public.ql370_get_original_owner_progress(uuid,uuid,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ql370_get_original_owner_progress(uuid,uuid,text)
  TO service_role;
COMMENT ON FUNCTION public.ql370_get_original_owner_progress(uuid,uuid,text) IS
  'QL-370 original owner-only read-only AAL2 progress via trusted Edge service. No membership, recovery, source or TEST mutation.';
