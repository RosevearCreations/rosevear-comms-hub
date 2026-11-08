import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../../migrations/20261108141847_ql370_dual_owner_readonly_progress.sql',
  import.meta.url),'utf8');
const edge=readFileSync(new URL('./index.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../../app/src/auth/OwnerProgressDashboard.tsx',import.meta.url),'utf8');

test('QL-370 progress is read-only SQL with zero membership, Auth or source mutations',()=>{
  assert.match(migration,/CREATE FUNCTION public\.ql370_get_original_owner_progress/);
  assert.match(migration,/RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''/);
  assert.doesNotMatch(migration,/^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER)\s+/im);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.ql370_get_original_owner_progress/);
  assert.match(migration,/FROM PUBLIC,anon,authenticated/);
  assert.match(migration,/TO service_role/);
});

test('owner data is bound to original UUIDs, verified AAL2 sessions and verified TOTP',()=>{
  assert.match(migration,/69f496bc-ee9d-4bdb-8022-0d5620a11b09/);
  assert.match(migration,/f8118088-01ee-4701-9f34-1480ec33723f/);
  assert.match(migration,/auth\.sessions s/);
  assert.match(migration,/s\.id=p_session_id AND s\.user_id=p_user_id AND s\.aal::text='aal2'/);
  assert.match(migration,/f\.status::text='verified'/);
  assert.match(migration,/master_private\.ql369_owner_mfa_attestations/);
  assert.match(migration,/master_private\.ql369_owner_activation_receipts/);
  assert.match(migration,/master_security_audit/);
});

test('readback deliberately hides original signatures, Auth IDs and untrusted claims',()=>{
  const reply=migration.slice(migration.indexOf('RETURN jsonb_build_object('));
  for(const privateField of ['sessionId','factorId','email','signedPacketSha256',
    'secret','ipAddress','accessToken','originalPublicKey']) {
    assert.doesNotMatch(reply,new RegExp("'"+privateField+"'"));
  }
  assert.match(reply,/'privateTestAuthorized',false/);
  assert.match(reply,/'connectionsState',CASE WHEN v_shell_count=6 AND v_held_count=6/);
  assert.match(reply,/NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION/);
});

test('Edge status is still original owner JWT and AAL2 restricted with no browser privileged RPC',()=>{
  assert.match(edge,/origin!==ORIGIN/);
  assert.match(edge,/auth\/v1\/user/);
  assert.match(edge,/claims\.aal!=='aal2'/);
  assert.match(edge,/body\?\.action==='status'/);
  assert.match(edge,/ql370_get_original_owner_progress/);
  assert.match(edge,/p_user_id:user\.id,p_session_id:claims\.session_id/);
  assert.match(edge,/invokePrivateRpc\(url,serviceKey/);
  assert.doesNotMatch(ui,/\.from\(|\.rpc\(|fetch\(/);
});

test('recovery controls describe local-only reset and peer hold without privileges',()=>{
  assert.match(ui,/Clear this browser's ceremony selections/);
  assert.match(ui,/It does not revoke a Supabase session, reset MFA, delete server evidence or activate membership/);
  assert.match(ui,/No customer access, private TEST, child tenancy or connections/);
  assert.match(ui,/This is a limited original-owner activation audit, not a full log/);
});
