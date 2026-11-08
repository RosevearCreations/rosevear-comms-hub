import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const reducer=read('app/src/auth/ql377OwnerIncidentHistory.ts');
const view=read('app/src/auth/OwnerIncidentHistory.tsx');
const shell=read('app/src/auth/MasterOperatorEntry.tsx');

test('QL-377 history is bounded to authenticated role-matched owner observations',()=>{
  assert.match(reducer,/MAX_OWNER_INCIDENT_HISTORY=40/);
  assert.match(reducer,/if\(!aal2\|\|!Number\.isFinite\(nowMs\)\)return EMPTY_OWNER_HISTORY/);
  assert.match(reducer,/previous\.role===role\?previous/);
  assert.match(reducer,/freshness\.kind==='unknown'/);
  assert.match(reducer,/noLongerShownMs/);
  assert.match(shell,/setIncidentHistory\(previous=>observeOwnerIncidents/);
  assert.match(shell,/authenticated=\{aal2&&incidentHistory\.role===ownerRole\}/);
  assert.match(view,/not server incident history or source audit evidence/);
  assert.match(view,/not independently resolved/);
  assert.match(view,/aria-live="polite"/);
  assert.match(view,/detailHeading\.current\?\.focus\(\)/);
});
test('QL-377 no storage, telemetry, server writes or incident acknowledgement',()=>{
  for(const source of [reducer,view]){
    assert.doesNotMatch(source,/\bfetch\s*\(|\.from\(|\.rpc\(|\.invoke\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|navigator\.sendBeacon/);
    assert.doesNotMatch(source,/signInWithPassword|challengeAndVerify|acknowledgeIncident|resolveIncident/);
  }
  assert.match(view,/href="#ql370-refresh-status"/);
});
