import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const guide=read('app/src/auth/ql371OwnerCeremony.ts');
const view=read('app/src/auth/OwnerCeremonyGuide.tsx');
const dashboard=read('app/src/auth/OwnerProgressDashboard.tsx');
const session=read('app/src/auth/MasterOwnerSessionGate.tsx');
const ql369=read('supabase/functions/ql369-owner-enrollment/index.ts');

test('QL-371 derives only read-only client guidance from the existing QL-370 AAL2 server snapshot',()=>{
  assert.match(dashboard,/OwnerCeremonyGuide/);
  assert.match(dashboard,/progress=\{loading\|\|failed\?null:snapshot\}/);
  assert.match(view,/buildOwnerCeremonySteps/);
  assert.match(guide,/snapshotAt/);
  assert.match(guide,/SNAPSHOT_FRESH_MS/);
  assert.match(guide,/status === 'CURRENT'|state === 'EXPIRED'/);
  assert.match(guide,/server rechecks/);
});

test('no auto attestation, account activation, new browser network or privileged DB calls',()=>{
  for(const file of [guide,view]){
    assert.doesNotMatch(file,/\.from\(|\.rpc\(|\.invoke\(|\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    assert.doesNotMatch(file,/\bfetch\s*\(|sendBeacon\(|new WebSocket\(/);
    assert.doesNotMatch(file,/signInWithPassword|challengeAndVerify|service_role|SUPABASE_SERVICE_ROLE_KEY/);
  }
  assert.match(session,/activateDualOwnerFromFiles/);
  assert.match(ql369,/claims\.aal!=='aal2'/);
  assert.match(ql369,/ql369_activate_original_dual_owner_once/);
});

test('original offline signatures remain unobservable until exact one-time verified activation',()=>{
  assert.match(guide,/offlineApprovalState === 'VERIFIED_AT_ORIGINAL_ACTIVATION'/);
  assert.match(guide,/verifiedActivationEvents === 1/);
  assert.match(guide,/activeOwnerMemberships === 2/);
  assert.match(guide,/heldApplicationShells === 6/);
  assert.match(view,/Original-device review/);
  assert.match(view,/not.*treated as completed/);
});

test('handoff never includes original intent content, signer bytes, passwords, or unsafe access promises',()=>{
  assert.match(guide,/SAFE_OWNER_HANDOFF/);
  assert.match(guide,/INSTRUCTIONS ONLY/);
  assert.match(guide,/Do not send passwords, MFA codes, tokens, private keys/);
  assert.match(guide,/This note is not authorization/);
  assert.match(guide,/DISCONNECTED \/ HOLD/);
  assert.match(view,/readOnly rows/);
  assert.match(view,/navigator\.clipboard\.writeText\(SAFE_OWNER_HANDOFF\)/);
  assert.doesNotMatch(view,/intentSha256|signedPacket|sourceCandidateText|masterCandidateText/);
});

test('accessible checklist has semantic ordered steps, focus, labelled note and clock warnings',()=>{
  assert.match(view,/<ol className="ql371-steps">/);
  assert.match(view,/aria-current=\{step\.id===actionable\?\.id\?'step':undefined\}/);
  assert.match(view,/role="status"/);
  assert.match(view,/<label htmlFor="ql371-safe-handoff">/);
  assert.match(view,/window\.clearInterval\(timer\)/);
  assert.match(guide,/clock appears behind the server/);
  assert.match(guide,/status readback|Status readback/);
});
