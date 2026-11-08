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

function fakeClient(kind: 'signed_out' | 'pending' | 'unrelated') {
  return {
    auth: {
      getUser: async () => ({
        data: { user: kind === 'signed_out' ? null : {
          id: reeId, email: 'owner@example.test', email_confirmed_at: '2026-11-08'
        } }, error: null
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null })
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
