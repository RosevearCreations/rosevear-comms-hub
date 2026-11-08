// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getOwnerAuthClient, getOwnerPortalConfig } from '../../supabase/ql367OwnerClient';
import { MasterOwnerSessionGate } from '../MasterOwnerSessionGate';

vi.mock('../../supabase/ql367OwnerClient', () => ({
  getOwnerAuthClient: vi.fn(),
  getOwnerPortalConfig: vi.fn()
}));

const reeId = '69f496bc-ee9d-4bdb-8022-0d5620a11b09';
let host: HTMLDivElement;
let root: Root;

function fakeClient(kind: 'signed_out' | 'pending' | 'unrelated',
  mfaMode: 'none' | 'verified' | 'challenge' | 'failure' = 'none') {
  return {
    auth: {
      getSession: async () => ({ data: { session: kind === 'signed_out' ? null : { access_token: 'fixture' } }, error: null }),
      getUser: async () => ({
        data: { user: kind === 'signed_out' ? null : {
          id: reeId, email: 'owner@example.test', email_confirmed_at: '2026-11-08'
        } }, error: null
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
      mfa: {
        listFactors: async () => ({ data: { totp: mfaMode === 'none' ? [] :
          [{ id: 'verified-factor', status: 'verified' }] },
          error: mfaMode === 'failure' ? { message: 'unavailable' } : null }),
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: mfaMode === 'verified' ? 'aal2' : 'aal1' }, error: null }),
        enroll: async () => ({ data: null, error: { message: 'fixture disabled' } }),
        challengeAndVerify: async () => ({ error: { message: 'fixture disabled' } })
      }
    },
    from: (table: string) => {
      const query = { eq: () => query, maybeSingle: async () => ({
        data: kind === 'unrelated' ? null : table === 'master_principals' ?
          { user_id: reeId, master_role: 'owner', active: false, enrollment_receipt_digest: null } :
          { user_id: reeId, organization_id: 'rosevear-creations', owner_role: 'source', active: false,
            signed_enrollment_receipt_sha256: null },
        error: null
      }) };
      return { select: () => query };
    }
  };
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.mocked(getOwnerPortalConfig).mockReturnValue({ enabled: true, ready: true, reason: '' });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  window.history.replaceState(null, '', '/');
  vi.clearAllMocks();
});

describe('QL-367 actual owner portal fail-closed rendering', () => {
  it('offers an individual password sign-in when no Auth session exists', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('signed_out') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('Master Owner Portal');
    expect(host.textContent).toContain('Sign in securely');
    expect(host.querySelector('input[type="password"]')).not.toBeNull();
    expect(host.textContent).not.toContain('Authenticated: Ree');
    expect(host.textContent).not.toContain('Owner verification is unavailable');
  });

  it('shows MFA setup and both independent owner-signature requirements without activating the account', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('Set up authenticator');
    expect(host.textContent).toContain('Ree’s original-device signature');
    expect(host.textContent).toContain('Jack’s original-device signature');
    expect(host.textContent).toContain('pending / inactive');
    expect(host.textContent).not.toContain('Unified Operator Shell');
  });

  it('distinguishes MFA AAL2 from pending enrollment, and never grants the shell', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending', 'verified') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('MFA verified (AAL2)');
    expect(host.textContent).toContain('Pending original-owner approval');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(host.textContent).not.toContain('Unified Operator Shell');
  });

  it('requires a fresh authenticator challenge after a password sign-in with an existing factor', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending', 'challenge') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('Six-digit authenticator code');
    expect(host.textContent).not.toContain('MFA verified (AAL2)');
  });

  it('keeps approval pending if the MFA service fails', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending', 'failure') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('MFA verification is temporarily unavailable');
    expect(host.textContent).toContain('pending / inactive');
    expect(host.textContent).not.toContain('MFA verified (AAL2)');
  });

  it('allows a signed-out owner to request recovery, but never renders the password change for a stranger', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('signed_out') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    const trigger = [...host.querySelectorAll('button')].find(item => item.textContent?.includes('Forgot password'));
    expect(trigger).toBeDefined();
    await act(async () => { trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(host.textContent).toContain('Request recovery email');
    expect(host.textContent).not.toContain('Update password and sign out');
  });

  it('rejects an unverified recovery return instead of exposing password update', async () => {
    window.history.replaceState(null, '', '/?owner_recovery=1#/master');
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('signed_out') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('recovery link has not established a verified owner session');
    expect(host.textContent).not.toContain('Update password and sign out');
  });

  it('allows password update UI only after a recovery return AND verified owner identity', async () => {
    window.history.replaceState(null, '', '/?owner_recovery=1#/master');
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('Set a new password');
    expect(host.textContent).not.toContain('Set up authenticator');
    expect(host.textContent).toContain('Pending original-owner approval');
  });

  it('recognizes the original Ree account but never exposes the operator shell while enrollment is inactive', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('pending') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('Authenticated: Ree');
    expect(host.textContent).toContain('Pending original-owner approval');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(host.textContent).not.toContain('Unified Operator Shell');
    expect(host.querySelector('input[type="password"]')).toBeNull();
  });

  it('denies an authenticated unrelated account even when the browser is authenticated', async () => {
    vi.mocked(getOwnerAuthClient).mockReturnValue(fakeClient('unrelated') as never);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('not a registered Rosevear Creations master owner');
    expect(host.textContent).toContain('Sign out');
    expect(host.textContent).not.toContain('Authenticated: Ree');
  });

  it('fails closed without the verified deployment configuration', async () => {
    vi.mocked(getOwnerPortalConfig).mockReturnValue({ enabled: false, ready: false, reason: 'Disabled' });
    vi.mocked(getOwnerAuthClient).mockReturnValue(null);
    await act(async () => { root.render(<MasterOwnerSessionGate />); });
    expect(host.textContent).toContain('All access remains disabled.');
    expect(host.querySelector('form')).toBeNull();
  });
});
