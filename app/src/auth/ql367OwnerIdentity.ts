/**
 * QL-367: read-only verification of an original owner's Supabase Auth identity.
 *
 * A valid login is NOT an enrollment decision or a source-application grant.
 * Every lookup is scoped by the server-validated auth.uid() through RLS.
 */
export type OriginalOwnerRole = 'source' | 'master';

export interface OwnerIdentity {
  userId: string;
  email: string;
  organizationId: 'rosevear-creations';
  ownerRole: OriginalOwnerRole;
  principalActive: boolean;
  membershipActive: boolean;
}

export type OwnerVerification =
  | { state: 'SIGNED_OUT' | 'DENIED' | 'ERROR'; message: string; identity: null }
  | { state: 'PENDING' | 'ENROLLED'; message: string; identity: OwnerIdentity };

type DbReply = { data: unknown; error: { message: string } | null };
type OwnerQuery = {
  eq(column: string, value: string): OwnerQuery;
  maybeSingle(): Promise<DbReply>;
};

/** Narrowly injectable to test negative-access cases without real credentials. */
export interface OwnerIdentityGateway {
  auth: {
    getSession(): Promise<{
      data: { session: { access_token?: string } | null };
      error: { message: string } | null;
    }>;
    getUser(): Promise<{
      data: { user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null };
      error: { message: string } | null;
    }>;
  };
  from(table: string): { select(columns: string): OwnerQuery };
}

type Principal = {
  user_id: string;
  master_role: string;
  active: boolean;
  enrollment_receipt_digest: string | null;
};

type Membership = {
  organization_id: string;
  user_id: string;
  owner_role: string;
  active: boolean;
  signed_enrollment_receipt_sha256: string | null;
};

const blocked = (message: string): OwnerVerification => ({ state: 'DENIED', message, identity: null });
const failed = (): OwnerVerification => ({
  state: 'ERROR',
  message: 'Owner verification is unavailable. Access remains locked. Please retry later.',
  identity: null
});

export async function verifyOriginalOwner(gateway: OwnerIdentityGateway): Promise<OwnerVerification> {
  try {
    // QL-368: an empty browser session is an ordinary signed-out state, not
    // an Auth server failure. Session data is NEVER used to authorize access.
    const { data: sessionData, error: sessionError } = await gateway.auth.getSession();
    if (sessionError) return failed();
    if (!sessionData.session) return { state: 'SIGNED_OUT', message: 'Sign in to continue.', identity: null };

    // getUser validates the access token against Supabase Auth. Email alone is never authority.
    const { data: authData, error: authError } = await gateway.auth.getUser();
    if (authError) return failed();
    const user = authData.user;
    if (!user) return { state: 'SIGNED_OUT', message: 'Sign in to continue.', identity: null };
    if (!user.id || !user.email_confirmed_at || !user.email) {
      return blocked('This account has not completed verified email authentication.');
    }

    const principalReply = await gateway.from('master_principals')
      .select('user_id,master_role,active,enrollment_receipt_digest')
      .eq('user_id', user.id)
      .maybeSingle();
    if (principalReply.error) return failed();
    const principal = principalReply.data as Principal | null;
    if (!principal || principal.user_id !== user.id || principal.master_role !== 'owner') {
      return blocked('This authenticated account is not a registered Rosevear Creations master owner.');
    }

    const membershipReply = await gateway.from('master_organization_owner_memberships')
      .select('organization_id,user_id,owner_role,active,signed_enrollment_receipt_sha256')
      .eq('organization_id', 'rosevear-creations')
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipReply.error) return failed();
    const membership = membershipReply.data as Membership | null;
    if (!membership || membership.organization_id !== 'rosevear-creations' ||
      membership.user_id !== user.id || !['source', 'master'].includes(membership.owner_role)) {
      return blocked('No original-owner organization membership is bound to this authenticated account.');
    }

    const identity: OwnerIdentity = {
      userId: user.id,
      email: user.email,
      organizationId: 'rosevear-creations',
      ownerRole: membership.owner_role as OriginalOwnerRole,
      principalActive: principal.active === true,
      membershipActive: membership.active === true
    };
    const enrolled = identity.principalActive && identity.membershipActive &&
      Boolean(principal.enrollment_receipt_digest) &&
      Boolean(membership.signed_enrollment_receipt_sha256);

    return enrolled
      ? {
          state: 'ENROLLED', identity,
          message: 'Owner enrollment is verified. Live connections remain DISCONNECTED / HOLD.'
        }
      : {
          state: 'PENDING', identity,
          message: 'Your sign-in is verified. Separate original-owner enrollment approval is still pending.'
        };
  } catch {
    return failed();
  }
}
