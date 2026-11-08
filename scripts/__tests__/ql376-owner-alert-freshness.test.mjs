import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const logic=read('app/src/auth/ql376OwnerIncidents.ts');
const view=read('app/src/auth/OwnerIncidentReview.tsx');
const shell=read('app/src/auth/MasterOperatorEntry.tsx');

test('QL-376 only derives alerts from individually protected aggregate readback',()=>{
  assert.match(logic,/progress\.ownerRole!==role/);
  assert.match(logic,/!aal2/);
  assert.match(logic,/age>120/);
  assert.match(logic,/age>=90/);
  assert.match(logic,/age < -10/);
  assert.match(logic,/not six independent live source checks/);
  assert.match(shell,/OwnerIncidentReview/);
  assert.match(view,/aria-live="polite"/);
  assert.match(view,/aria-pressed=\{chosen\?\.id===alert\.id\}/);
  assert.match(view,/detailHeading\.current\?\.focus\(\)/);
});
test('QL-376 introduces no hidden enrollment, provider, storage or network actions',()=>{
  for(const source of [logic,view]){
    assert.doesNotMatch(source,/\bfetch\s*\(|\.from\(|\.rpc\(|\.invoke\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|BroadcastChannel|signInWithPassword|challengeAndVerify/);
    assert.doesNotMatch(source,/window\.open|javascript:|onClick=\{.*activate/i);
  }
  assert.match(view,/href="#ql370-refresh-status"/);
});
