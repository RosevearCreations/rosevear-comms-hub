import { describe, expect, it } from 'vitest';
import { inspectOwnerMfa, isValidTotpCode, safeTotpQrSource, type OwnerMfaGateway } from '../ql368OwnerMfa';

type Scenario = {
  factors?: Array<{ id: string; status: string }>;
  level?: string | null;
  factorsError?: boolean;
  levelError?: boolean;
  malformed?: boolean;
};

function gateway(scenario: Scenario = {}): OwnerMfaGateway {
  return {
    auth: { mfa: {
      listFactors: async () => ({
        data: scenario.malformed ? null : { totp: scenario.factors ?? [] },
        error: scenario.factorsError ? { message: 'not allowed' } : null
      }),
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: scenario.level ?? 'aal1' },
        error: scenario.levelError ? { message: 'unavailable' } : null
      })
    } }
  };
}

describe('QL-368 isolated Supabase MFA assurance', () => {
  it('offers TOTP setup only when there are no verified factors', async () => {
    expect((await inspectOwnerMfa(gateway())).kind).toBe('ENROLL');
    expect((await inspectOwnerMfa(gateway({
      factors: [{ id: 'unverified-factor', status: 'unverified' }], level: 'aal2'
    }))).kind).toBe('ENROLL');
  });

  it('requires a fresh second-factor challenge for existing AAL1 sessions', async () => {
    const result = await inspectOwnerMfa(gateway({
      factors: [{ id: 'real-factor', status: 'verified' }], level: 'aal1'
    }));
    expect(result).toMatchObject({ kind: 'CHALLENGE', factorId: 'real-factor' });
  });

  it('reports verified MFA only with BOTH a verified factor and AAL2', async () => {
    expect(await inspectOwnerMfa(gateway({
      factors: [{ id: 'verified-factor', status: 'verified' }], level: 'aal2'
    }))).toMatchObject({ kind: 'VERIFIED', factorId: 'verified-factor' });
    expect((await inspectOwnerMfa(gateway({ level: 'aal2' }))).kind).toBe('ENROLL');
  });

  it('fails closed if either Auth MFA endpoint fails or returns malformed information', async () => {
    for (const scenario of [{ factorsError: true }, { levelError: true }, { malformed: true }]) {
      expect((await inspectOwnerMfa(gateway(scenario))).kind).toBe('ERROR');
    }
  });

  it('never accepts malformed or overlong TOTP codes', () => {
    expect(isValidTotpCode('123456')).toBe(true);
    for (const value of ['12345', '1234567', '123 456', 'abcdef', '000000\n999999']) {
      expect(isValidTotpCode(value)).toBe(false);
    }
  });

  it('never renders a remote or script QR URL; secret entry is the safe fallback', () => {
    expect(safeTotpQrSource('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    for (const source of [null, 'https://wrong.invalid/qr', 'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=', 'data:image/svg+xml,<svg onload=alert(1)>']) {
      expect(safeTotpQrSource(source)).toBeNull();
    }
  });
});
