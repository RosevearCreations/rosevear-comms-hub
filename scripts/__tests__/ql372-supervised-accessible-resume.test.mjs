import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const policy=read('app/src/auth/ql372OwnerResume.ts');
const walkthrough=read('app/src/auth/OwnerCeremonyWalkthrough.tsx');
const guide=read('app/src/auth/OwnerCeremonyGuide.tsx');
const gate=read('app/src/auth/MasterOwnerSessionGate.tsx');
const style=read('app/src/auth/ql367MasterOwner.css');

test('QL-372 restores only a tab-scoped, whitelisted, versioned help-step ID',()=>{
  assert.match(policy,/v1:/);
  assert.match(policy,/WALKTHROUGH_STEP_IDS\.includes/);
  assert.match(policy,/keyFor\(role\)/);
  assert.match(walkthrough,/window\.sessionStorage/);
  assert.doesNotMatch(walkthrough+policy,/localStorage|indexedDB|postMessage\(|BroadcastChannel/);
  assert.doesNotMatch(walkthrough+policy,/JSON\.stringify|navigator\.clipboard|intentSha256|signedPacketFile|password/);
});

test('only a fresh, matching AAL2 protected status with all six HOLD allows resume',()=>{
  for(const guard of ['sessionAal2Verified','ownerRole === role','sessionAal2Verified','heldApplicationShells === 6',
    'totalApplicationShells === 6','DISCONNECTED / HOLD','!progress.privateTestAuthorized','FRESH_SNAPSHOT_MS']){
    assert.ok(policy.includes(guard),guard);
  }
  assert.match(walkthrough,/if \(!verifiedReadback\|\|restoredForRole\.current\)return/);
  assert.match(walkthrough,/if\(verifiedReadback&&storage\)saveHelpPosition/);
});

test('buttons navigate only instructions and do not issue Auth, Supabase or activation calls',()=>{
  for(const file of [policy,walkthrough]){
    assert.doesNotMatch(file,/\.invoke\(|\.rpc\(|\.from\(|\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    assert.doesNotMatch(file,/fetch\s*\(|signInWithPassword|challengeAndVerify|activateDualOwnerFromFiles|attestOwnerMfa/);
  }
  assert.match(walkthrough,/Navigation is only a reading aid/);
  assert.match(walkthrough,/All six application shells remain DISCONNECTED \/ HOLD/);
  assert.match(guide,/OwnerCeremonyWalkthrough/);
});

test('sign-out and clear-local ceremony selections remove both role positions',()=>{
  assert.match(policy,/clearAllOwnerHelpPositions/);
  assert.match(gate,/async function signOut[\s\S]*?clearAllOwnerHelpPositions\(window\.sessionStorage\)/);
  assert.match(gate,/onClearLocal=\{\(\)=>\{[\s\S]*?clearAllOwnerHelpPositions\(window\.sessionStorage\)/);
  assert.match(gate,/key=\{ceremonyReset\}/);
});

test('screen-reader focus, status narration and keyboard operability are explicit',()=>{
  assert.match(walkthrough,/aria-labelledby="ql372-walkthrough-title"/);
  assert.match(walkthrough,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(walkthrough,/aria-controls="ql372-current-step"/);
  assert.match(walkthrough,/headingRef\.current\?\.focus\(\)/);
  assert.match(walkthrough,/tabIndex=\{-1\}/);
  assert.match(style,/\.ql372-navigation button \{ min-height: 44px/);
  assert.match(style,/@media \(forced-colors: active\)/);
});
