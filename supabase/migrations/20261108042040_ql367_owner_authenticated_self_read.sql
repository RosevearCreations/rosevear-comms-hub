-- QL-367: owner identity check only. Never enables a principal, membership,
-- shell grant, private TEST, source connection or customer operation.
-- Supabase Auth validates the JWT; RLS binds these read-only rows to auth.uid().

-- The QL-331 active-only read policy remains in place. A second self-only
-- SELECT policy allows genuine, INACTIVE original owners to see their own
-- pending enrollment status after sign-in; it never changes active=false.
CREATE POLICY ql367_master_principal_pending_self_read
  ON public.master_principals FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- QL-366 memberships have FORCE RLS and no client access by default.
-- Expose only the signed-in user's own enrollment status to the browser.
GRANT SELECT (organization_id,owner_role,user_id,active,signed_enrollment_receipt_sha256)
  ON public.master_organization_owner_memberships TO authenticated;

CREATE POLICY ql367_master_organization_member_self_read
  ON public.master_organization_owner_memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- No INSERT/UPDATE/DELETE grant or policy, no anonymous read, no membership
-- activation and no shell data or customer access are introduced here.
