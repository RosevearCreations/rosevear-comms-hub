import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const policy=read('app/src/auth/ql373OwnerReadiness.ts');
const panel=read('app/src/auth/OwnerReadinessSupport.tsx');
const guide=read('app/src/auth/OwnerCeremonyGuide.tsx');
const progress=read('app/src/auth/OwnerProgressDashboard.tsx');
const css=read('app/src/auth/ql367MasterOwner.css');

test('QL-373 is a bounded read-only UI without new Auth, Edge, SQL or network operations',()=>{
  for(const source of [policy,panel]){
    assert.doesNotMatch(source,/\.invoke\(|\.rpc\(|\.from\(|\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    assert.doesNotMatch(source,/fetch\s*\(|signInWithPassword|challengeAndVerify|activateDualOwnerFromFiles|attestOwnerMfa/);
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|postMessage\(|BroadcastChannel/);
    assert.doesNotMatch(source,/fileReader|type="file"|input type="password"/i);
  }
  assert.match(guide,/OwnerReadinessSupport/);
  assert.match(progress,/id="ql370-refresh-status"/);
});

test('help addresses are fixed official or own-repository HTTPS links with no interpolation',()=>{
  assert.match(policy,/OWNER_HELP_LINKS/);
  assert.match(policy,/https:\/\/supabase\.com\/docs\/guides\/auth\/auth-mfa/);
  assert.match(policy,/https:\/\/github\.com\/RosevearCreations\/rosevear-comms-hub\/blob\/main\/docs\/build-records\/QL-369_/);
  assert.match(panel,/target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(panel+policy,/href=\{[^}]*\+|new URLSearchParams|\?token=|\?code=/);
});

test('device note is explicitly selected, redacted, role separate and non-authorizing',()=>{
  assert.match(panel,/type AcceptanceAnswers/);
  assert.match(panel,/\<fieldset/);
  assert.match(panel,/\<legend\>/);
  assert.match(panel,/readOnly rows=\{12\}/);
  assert.match(panel,/navigator\.clipboard\.writeText\(note\)/);
  assert.match(panel,/onClick=\{\(\)=>\{void copyNote\(\);\}\}/);
  assert.match(policy,/Self-reported observer:/);
  assert.match(policy,/NOT identity verification/);
  assert.match(policy,/DISCONNECTED \/ HOLD/);
  assert.doesNotMatch(policy,/JSON\.stringify|toLocaleString|Date\.now/);
  assert.match(css,/\.ql373-note-buttons button \{ min-height: 44px/);
  assert.match(css,/\.ql373-support select:focus-visible/);
});

test('HOLD drift preempts all positive diagnostics and countdown cannot authorize',()=>{
  const drift=policy.indexOf("issue('STOP_REVIEW'");
  const success=policy.indexOf("issue('OWNER_VERIFIED_HELD'");
  assert.ok(drift>=0&&success>drift);
  for(const s of ['heldApplicationShells!==6','totalApplicationShells!==6','privateTestAuthorized',
    'ownerRole!==ownerRole','countdownForAttestation','isOriginalActivationVerified'])assert.ok(policy.includes(s),s);
});
