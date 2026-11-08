-- QL-369: two genuinely authenticated AAL2 owners plus original Ed25519
-- signature verification by the server are prerequisites to ONE atomic
-- membership activation. This migration records NO attestation or activation.
-- Server-only RPCs are intentionally exposed only to service_role; never to
-- anon/authenticated. The signed packet is verified outside Postgres by the
-- locked-down QL-369 Edge Function before this RPC can be invoked.

CREATE TABLE master_private.ql369_owner_mfa_attestations (
  organization_id text NOT NULL REFERENCES public.master_organizations(organization_id) ON DELETE RESTRICT,
  owner_role text NOT NULL CHECK (owner_role IN ('source','master')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL,
  factor_id uuid NOT NULL,
  intent_sha256 char(64) NOT NULL CHECK (intent_sha256 ~ '^[a-f0-9]{64}$'),
  attested_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (organization_id,owner_role),
  UNIQUE (organization_id,user_id),
  CHECK (expires_at > attested_at AND expires_at <= attested_at + interval '30 minutes')
);

CREATE TABLE master_private.ql369_owner_activation_receipts (
  organization_id text PRIMARY KEY REFERENCES public.master_organizations(organization_id) ON DELETE RESTRICT,
  intent_sha256 char(64) NOT NULL UNIQUE CHECK (intent_sha256 ~ '^[a-f0-9]{64}$'),
  approvals_sha256 char(64) NOT NULL CHECK (approvals_sha256 ~ '^[a-f0-9]{64}$'),
  signed_packet_sha256 char(64) NOT NULL UNIQUE CHECK (signed_packet_sha256 ~ '^[a-f0-9]{64}$'),
  source_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  master_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  source_session_id uuid NOT NULL,
  master_session_id uuid NOT NULL,
  original_pins_verified boolean NOT NULL CHECK (original_pins_verified),
  server_mfa_verified boolean NOT NULL CHECK (server_mfa_verified),
  private_test_authorized boolean NOT NULL DEFAULT false CHECK (NOT private_test_authorized),
  source_connections_allowed boolean NOT NULL DEFAULT false CHECK (NOT source_connections_allowed),
  inserted_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_user_id <> master_user_id),
  CHECK (source_session_id <> master_session_id)
);

REVOKE ALL ON TABLE master_private.ql369_owner_mfa_attestations,
  master_private.ql369_owner_activation_receipts
  FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE master_private.ql369_owner_mfa_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_private.ql369_owner_mfa_attestations FORCE ROW LEVEL SECURITY;
ALTER TABLE master_private.ql369_owner_activation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_private.ql369_owner_activation_receipts FORCE ROW LEVEL SECURITY;

-- Independently called with each owner's *server-validated* Auth access token.
-- Caller cannot choose another user's UUID in the Edge Function; the function
-- additionally compares against the actual auth.sessions and verified factor.
CREATE FUNCTION public.ql369_record_original_owner_mfa(
  p_user_id uuid,p_session_id uuid,p_intent_sha256 text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_role text;
  v_factor uuid;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_user_id IS NULL OR p_session_id IS NULL OR
     p_intent_sha256 !~ '^[a-f0-9]{64}$' OR p_intent_sha256 = repeat('0',64) THEN
    RAISE EXCEPTION 'DENY_QL369_MALFORMED_OWNER_ATTESTATION';
  END IF;
  SELECT m.owner_role INTO STRICT v_role
  FROM public.master_organization_owner_memberships m
  JOIN public.master_principals p ON p.user_id=m.user_id
  JOIN public.master_organizations o ON o.organization_id=m.organization_id
  WHERE m.organization_id='rosevear-creations' AND m.user_id=p_user_id
    AND NOT m.active AND NOT p.active AND p.master_role='owner'
    AND o.enrollment_state='PENDING_VERIFIED_AUTH_USERS';

  SELECT s.factor_id INTO STRICT v_factor
  FROM auth.sessions s JOIN auth.mfa_factors f
    ON f.id=s.factor_id AND f.user_id=s.user_id
  JOIN auth.users u ON u.id=s.user_id
  WHERE s.id=p_session_id AND s.user_id=p_user_id AND s.aal::text='aal2'
    AND (s.not_after IS NULL OR s.not_after>v_now)
    AND f.factor_type::text='totp' AND f.status::text='verified'
    AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
    AND u.is_anonymous IS NOT TRUE
    AND (u.banned_until IS NULL OR u.banned_until<v_now);

  INSERT INTO master_private.ql369_owner_mfa_attestations
    (organization_id,owner_role,user_id,session_id,factor_id,
     intent_sha256,attested_at,expires_at)
  VALUES ('rosevear-creations',v_role,p_user_id,p_session_id,v_factor,
    p_intent_sha256,v_now,v_now+interval '30 minutes')
  ON CONFLICT (organization_id,owner_role) DO UPDATE SET
    user_id=EXCLUDED.user_id,session_id=EXCLUDED.session_id,
    factor_id=EXCLUDED.factor_id,intent_sha256=EXCLUDED.intent_sha256,
    attested_at=EXCLUDED.attested_at,expires_at=EXCLUDED.expires_at;
  RETURN jsonb_build_object('state','OWNER_AAL2_ATTESTED_PENDING_PEER_AND_ORIGINAL_SIGNATURES',
    'ownerRole',v_role,'intentSha256',p_intent_sha256,
    'expiresAt',(v_now+interval '30 minutes'),
    'membershipActivated',false,'privateTestAuthorized',false);
EXCEPTION WHEN no_data_found OR too_many_rows THEN
  RAISE EXCEPTION 'DENY_QL369_OWNER_OR_CURRENT_VERIFIED_MFA_REQUIRED';
END; $$;

-- Exactly one transaction activates the TWO original owner memberships;
-- separate shell grants, TEST operations and customer access remain untouched.
CREATE FUNCTION public.ql369_activate_original_dual_owner_once(
  p_actor_user_id uuid,p_actor_session_id uuid,
  p_source_user_id uuid,p_master_user_id uuid,
  p_intent_sha256 text,p_approvals_sha256 text,p_signed_packet_sha256 text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_role text;
  v_att master_private.ql369_owner_mfa_attestations%ROWTYPE;
  v_source_session uuid;
  v_master_session uuid;
  v_count integer;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_source_user_id IS NULL OR p_master_user_id IS NULL OR
     p_source_user_id=p_master_user_id OR
     p_actor_user_id IS DISTINCT FROM p_source_user_id OR
     p_actor_session_id IS NULL OR
     p_intent_sha256 !~ '^[a-f0-9]{64}$' OR
     p_approvals_sha256 !~ '^[a-f0-9]{64}$' OR
     p_signed_packet_sha256 !~ '^[a-f0-9]{64}$' OR
     p_intent_sha256=repeat('0',64) OR
     p_signed_packet_sha256=repeat('0',64) THEN
    RAISE EXCEPTION 'DENY_QL369_INVALID_ACTIVATION_SCOPE';
  END IF;

  -- This organization lock serializes concurrent and replayed attempts.
  PERFORM 1 FROM public.master_organizations
  WHERE organization_id='rosevear-creations'
    AND enrollment_state='PENDING_VERIFIED_AUTH_USERS' FOR UPDATE;
  IF NOT FOUND OR EXISTS (SELECT 1 FROM master_private.ql369_owner_activation_receipts
    WHERE organization_id='rosevear-creations') THEN
    RAISE EXCEPTION 'DENY_QL369_ALREADY_ACTIVATED_OR_NOT_PENDING';
  END IF;
  -- No additional unexpected shell or owner can coexist with activation.
  SELECT count(*) INTO v_count FROM public.master_organization_shells
  WHERE organization_id='rosevear-creations';
  IF v_count<>6 THEN RAISE EXCEPTION 'HOLD_QL369_EXACTLY_SIX_SHELLS_REQUIRED'; END IF;
  SELECT count(*) INTO v_count FROM public.master_organization_shells
  WHERE organization_id='rosevear-creations'
    AND connection_state='DISCONNECTED / HOLD'
    AND NOT child_tenant_access AND NOT customer_operations;
  IF v_count<>6 THEN RAISE EXCEPTION 'HOLD_QL369_SIX_SHELL_ISOLATION_REQUIRED'; END IF;

  SELECT count(*) INTO v_count FROM public.master_organization_owner_memberships
  WHERE organization_id='rosevear-creations';
  IF v_count<>2 THEN RAISE EXCEPTION 'DENY_QL369_UNEXPECTED_OWNER_MEMBERSHIP'; END IF;
  SELECT count(*) INTO v_count FROM public.master_principals;
  IF v_count<>2 THEN RAISE EXCEPTION 'DENY_QL369_UNEXPECTED_MASTER_PRINCIPAL'; END IF;

  SELECT count(*) INTO v_count
  FROM public.master_organization_owner_memberships m
  JOIN public.master_principals p ON p.user_id=m.user_id
  WHERE m.organization_id='rosevear-creations' AND NOT m.active
    AND NOT p.active AND p.master_role='owner'
    AND p.enrollment_receipt_digest IS NULL
    AND m.signed_enrollment_receipt_sha256 IS NULL
    AND ((m.owner_role='source' AND m.user_id=p_source_user_id) OR
         (m.owner_role='master' AND m.user_id=p_master_user_id));
  IF v_count<>2 THEN RAISE EXCEPTION 'DENY_QL369_EXACT_ORIGINAL_OWNER_BINDING_REQUIRED'; END IF;

  FOR v_role IN SELECT unnest(ARRAY['source','master']) LOOP
    SELECT * INTO STRICT v_att FROM master_private.ql369_owner_mfa_attestations
    WHERE organization_id='rosevear-creations' AND owner_role=v_role
      AND user_id=CASE WHEN v_role='source' THEN p_source_user_id ELSE p_master_user_id END
      AND intent_sha256=p_intent_sha256 AND expires_at>v_now AND attested_at<=v_now
    FOR UPDATE;
    IF NOT EXISTS (
      SELECT 1 FROM auth.sessions s JOIN auth.mfa_factors f
        ON f.id=s.factor_id AND f.user_id=s.user_id
      JOIN auth.users u ON u.id=s.user_id
      WHERE s.id=v_att.session_id AND s.user_id=v_att.user_id
        AND s.factor_id=v_att.factor_id AND s.aal::text='aal2'
        AND (s.not_after IS NULL OR s.not_after>v_now)
        AND f.factor_type::text='totp' AND f.status::text='verified'
        AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
        AND u.is_anonymous IS NOT TRUE
        AND (u.banned_until IS NULL OR u.banned_until<v_now)
    ) THEN RAISE EXCEPTION 'DENY_QL369_STALE_OR_REVOKED_SERVER_MFA'; END IF;
    IF v_role='source' THEN v_source_session:=v_att.session_id;
    ELSE v_master_session:=v_att.session_id; END IF;
  END LOOP;
  IF v_source_session=p_actor_session_id AND v_source_session<>v_master_session THEN
    -- The source owner must be signed in and MFA-confirmed at activation.
    NULL;
  ELSE RAISE EXCEPTION 'DENY_QL369_ORIGINAL_SOURCE_OWNER_SESSION_REQUIRED'; END IF;

  INSERT INTO master_private.ql369_owner_activation_receipts
    (organization_id,intent_sha256,approvals_sha256,signed_packet_sha256,
     source_user_id,master_user_id,source_session_id,master_session_id,
     original_pins_verified,server_mfa_verified)
  VALUES ('rosevear-creations',p_intent_sha256,p_approvals_sha256,
    p_signed_packet_sha256,p_source_user_id,p_master_user_id,
    v_source_session,v_master_session,true,true);

  UPDATE public.master_organization_owner_memberships SET
    active=true,signed_enrollment_receipt_sha256=p_signed_packet_sha256
  WHERE organization_id='rosevear-creations' AND NOT active AND
    ((owner_role='source' AND user_id=p_source_user_id) OR
     (owner_role='master' AND user_id=p_master_user_id));
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>2 THEN RAISE EXCEPTION 'DENY_QL369_MEMBERSHIP_UPDATE_COUNT'; END IF;

  UPDATE public.master_principals p SET active=true,
    enrollment_receipt_digest=p_signed_packet_sha256,updated_at=v_now,
    enrolled_by=CASE WHEN p.user_id=p_source_user_id THEN p_master_user_id
                     ELSE p_source_user_id END
  WHERE NOT p.active AND p.user_id IN (p_source_user_id,p_master_user_id);
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>2 THEN RAISE EXCEPTION 'DENY_QL369_PRINCIPAL_UPDATE_COUNT'; END IF;

  UPDATE public.master_organizations SET enrollment_state='VERIFIED'
  WHERE organization_id='rosevear-creations' AND enrollment_state='PENDING_VERIFIED_AUTH_USERS';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'DENY_QL369_ORGANIZATION_UPDATE_COUNT'; END IF;

  INSERT INTO public.master_security_audit(actor_user_id,action_code,receipt_sha256)
  VALUES (p_source_user_id,'QL369_AUTHENTICATED_ORIGINAL_DUAL_OWNER_MEMBERSHIP',p_signed_packet_sha256);
  RETURN jsonb_build_object('state','DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE',
    'activated',true,'membershipsActivated',2,'receiptSha256',p_signed_packet_sha256,
    'privateTestAuthorized',false,'sourceConnectionsAllowed',false,
    'connectionState','DISCONNECTED / HOLD');
EXCEPTION WHEN no_data_found OR too_many_rows THEN
  RAISE EXCEPTION 'DENY_QL369_TWO_FRESH_INDEPENDENT_AAL2_ATTESTATIONS_REQUIRED';
END; $$;

REVOKE ALL ON FUNCTION public.ql369_record_original_owner_mfa(uuid,uuid,text),
  public.ql369_activate_original_dual_owner_once(uuid,uuid,uuid,uuid,text,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ql369_record_original_owner_mfa(uuid,uuid,text),
  public.ql369_activate_original_dual_owner_once(uuid,uuid,uuid,uuid,text,text,text)
  TO service_role;

COMMENT ON FUNCTION public.ql369_activate_original_dual_owner_once(uuid,uuid,uuid,uuid,text,text,text) IS
  'Only the trusted QL-369 server, after original Ed25519 packet verification and both AAL2 Auth sessions; never callable by the browser.';
