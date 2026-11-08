import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const selector=read('app/src/auth/ql378OwnerIncidentTriage.ts');
const view=read('app/src/auth/OwnerIncidentHistory.tsx');
const shell=read('app/src/auth/MasterOperatorEntry.tsx');

test('QL-378 derives search and deduplicated triage without discarding occurrence evidence',()=>{
  assert.match(selector,/options\.groupRepeats\?entry\.key/);
  assert.match(selector,/group\.push\(entry\)/);
  assert.match(selector,/occurrences:ordered/);
  assert.match(selector,/options\.search\.trim\(\)\.slice\(0,100\)/);
  assert.match(selector,/ownerTriageEvidence\(latest\.snapshotAt,options\.nowMs\)/);
  assert.match(selector,/ownerTriagePriority/);
  assert.match(selector,/not independently source-verified/);
  assert.match(view,/Individual observed alert episodes/);
  assert.match(view,/Search alerts/);
  assert.match(view,/Group repeated alerts/);
  assert.match(view,/not independently resolved/);
  assert.match(shell,/authenticated=\{aal2&&incidentHistory\.role===ownerRole\}/);
});
test('QL-378 exposes no implicit authorization, persistence, network or incident writes',()=>{
  for(const source of [selector,view]){
    assert.doesNotMatch(source,/\bfetch\s*\(|\.rpc\(|\.invoke\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|sendBeacon/);
    assert.doesNotMatch(source,/signInWithPassword|challengeAndVerify|activateSource|acknowledgeIncident|resolveIncident/);
  }
  assert.match(view,/href="#ql370-refresh-status"/);
});
