import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  verifyOriginalOwner, type OwnerIdentityGateway
} from '../ql367OwnerIdentity';

const reeId = '69f496bc-ee9d-4bdb-8022-0d5620a11b09';
const jackId = 'f8118088-01ee-4701-9f34-1480ec33723f';
const receipt = 'a'.repeat(64);

type Scenario = {
  user?: { id: string; email?: string; email_confirmed_at?: string | null } | null;
  authError?: boolean;
  sessionError?: boolean;
  noSession?: boolean;
  principal?: Record<string, unknown> | null;
  member?: Record<string, unknown> | null;
  errorTable?: string;
};

function fixture(options: Scenario = {}) {
  const calls: string[] = [];
  const user = options.user === undefined
    ? { id: reeId, email: 'verified-owner@example.test', email_confirmed_at: '2026-11-08T00:00:00Z' }
    : options.user;
  const principal = options.principal === undefined
    ? { user_id: reeId, master_role: 'owner', active: false, enrollment_receipt_digest: null }
    : options.principal;
  const member = options.member === undefined
    ? { organization_id: 'rosevear-creations', user_id: reeId, owner_role: 'source', active: false,
      signed_enrollment_receipt_sha256: null }
    : options.member;
  const gateway: OwnerIdentityGateway = {
    auth: { getSession: async () => {
      calls.push('getSession');
      return { data: { session: options.noSession ? null : { access_token: 'fixture-token' } },
        error: options.sessionError ? { message: 'storage error' } : null };
    }, getUser: async () => {
      calls.push('getUser');
      return { data: { user: user ?? null }, error: options.authError ? { message: 'bad token' } : null };
    } },
    from: (table) => {
      calls.push(table);
      const values: Record<string, string> = {};
      const query = {
        eq(column: string, value: string) { values[column] = value; return query; },
        async maybeSingle() {
          calls.push(`${table}:${JSON.stringify(values)}`);
          return { data: table === 'master_principals' ? principal : member,
            error: table === options.errorTable ? { message: 'RLS denied' } : null };
        }
      };
      return { select: (_columns: string) => query };
    }
  };
  return { gateway, calls };
}

describe('QL-367 authenticated original-owner portal', () => {
  it('requires a genuinely verified Supabase Auth user before database reads', async () => {
    for (const scenario of [
      { user: null },
      { authError: true },
      { user: { id: reeId, email: 'verified-owner@example.test', email_confirmed_at: null } },
      { user: { id: reeId, email_confirmed_at: '2026-11-08' } }
    ]) {
      const { gateway, calls } = fixture(scenario);
      const response = await verifyOriginalOwner(gateway);
      expect(response.state).not.toBe('PENDING');
      expect(response.state).not.toBe('ENROLLED');
      expect(calls).toEqual(['getSession','getUser']);
    }
  });

  it('QL-368 fixes the first-visit screenshot: no browser session is a normal sign-in, not an error', async () => {
    const { gateway, calls } = fixture({ noSession: true });
    const result = await verifyOriginalOwner(gateway);
    expect(result.state).toBe('SIGNED_OUT');
    expect(calls).toEqual(['getSession']);
    const failedSession = await verifyOriginalOwner(fixture({ sessionError: true }).gateway);
    expect(failedSession.state).toBe('ERROR');
  });

  it('rejects an authenticated but unrelated identity; no email can bypass UUID binding', async () => {
    for (const scenario of [
      { user: { id: jackId, email: 'verified-owner@example.test', email_confirmed_at: '2026-11-08' } },
      { principal: null },
      { principal: { user_id: reeId, master_role: 'auditor', active: true } },
      { member: null },
      { member: { organization_id: 'other-company', owner_role: 'source', user_id: reeId, active: true } },
      { member: { organization_id: 'rosevear-creations', owner_role: 'reviewer', user_id: reeId, active: true } }
    ]) {
      const { gateway } = fixture(scenario);
      expect((await verifyOriginalOwner(gateway)).state).toBe('DENIED');
    }
  });

  it('recognizes Ree as authenticated but keeps inactive owner memberships pending', async () => {
    const { gateway, calls } = fixture();
    const result = await verifyOriginalOwner(gateway);
    expect(result.state).toBe('PENDING');
    if (result.identity) expect(result.identity).toMatchObject({
      userId: reeId, ownerRole: 'source', principalActive: false,
      membershipActive: false, organizationId: 'rosevear-creations'
    });
    expect(calls.some(x => x.includes('master_principals:{"user_id":"' + reeId + '"}'))).toBe(true);
    expect(calls.some(x => x.includes('"organization_id":"rosevear-creations"'))).toBe(true);
    expect(calls).not.toContain('master_shell_grants');
    expect(calls).not.toContain('app_admins');
  });

  it('refuses to mark an active row enrolled without BOTH independent enrollment receipts', async () => {
    for (const scenario of [
      { principal: { user_id: reeId, master_role: 'owner', active: true, enrollment_receipt_digest: null },
        member: { organization_id: 'rosevear-creations', owner_role: 'source', user_id: reeId, active: true,
          signed_enrollment_receipt_sha256: receipt } },
      { principal: { user_id: reeId, master_role: 'owner', active: true, enrollment_receipt_digest: receipt },
        member: { organization_id: 'rosevear-creations', owner_role: 'source', user_id: reeId, active: false,
          signed_enrollment_receipt_sha256: receipt } }
    ]) {
      expect((await verifyOriginalOwner(fixture(scenario).gateway)).state).toBe('PENDING');
    }
  });

  it('recognizes enrolled Jack only with both active records and receipts, without granting sources', async () => {
    const { gateway, calls } = fixture({
      user: { id: jackId, email: 'jack@example.test', email_confirmed_at: '2026-11-08' },
      principal: { user_id: jackId, master_role: 'owner', active: true, enrollment_receipt_digest: receipt },
      member: { organization_id: 'rosevear-creations', user_id: jackId, owner_role: 'master', active: true,
        signed_enrollment_receipt_sha256: receipt }
    });
    const result = await verifyOriginalOwner(gateway);
    expect(result.state).toBe('ENROLLED');
    expect(result.identity?.ownerRole).toBe('master');
    expect(calls).toHaveLength(6);
  });

  it('fails closed on either RLS query error', async () => {
    for (const errorTable of ['master_principals','master_organization_owner_memberships']) {
      const result = await verifyOriginalOwner(fixture({ errorTable }).gateway);
      expect(result.state).toBe('ERROR');
      expect(result.identity).toBeNull();
    }
  });

  it('migration permits only authenticated self reads and never changes enrolled state or six-app gates', () => {
    const sql = readFileSync('../supabase/migrations/20261108042040_ql367_owner_authenticated_self_read.sql','utf8');
    expect(sql).toContain('user_id = (SELECT auth.uid())');
    expect(sql).toContain('TO authenticated');
    expect(sql).toContain('FOR SELECT');
    expect(sql).not.toMatch(/CREATE POLICY[^;]*FOR\s+(ALL|INSERT|UPDATE|DELETE)/i);
    expect(sql.replace(/--[^\n]*$/gm, '')).not.toMatch(/(?:\bUPDATE\b|\bINSERT INTO\b|\bDELETE FROM\b|SECURITY DEFINER|GRANT ALL)/i);
  });
});
