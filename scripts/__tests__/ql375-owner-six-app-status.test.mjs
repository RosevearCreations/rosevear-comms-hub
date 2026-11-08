import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const catalogue=read('app/src/auth/ql375OwnerStatus.ts');
const drilldown=read('app/src/auth/OwnerSixAppDrilldown.tsx');
const shell=read('app/src/auth/MasterOperatorEntry.tsx');
const gate=read('app/src/auth/MasterOwnerSessionGate.tsx');
const guide=read('app/src/auth/OwnerCeremonyGuide.tsx');

test('QL-375 status stays within protected aggregate readback and canonical shell mapping',()=>{
  for(const id of ['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']){
    assert.match(catalogue,new RegExp(`id:'${id}'`));
  }
  assert.match(catalogue,/This is aggregate evidence, not an individual live source check/);
  assert.match(catalogue,/truth\.state==='STOP_REVIEW'/);
  assert.match(catalogue,/if\(truth\.held\)/);
  assert.match(drilldown,/aria-pressed=\{selected===item\.id\}/);
  assert.match(drilldown,/detailHeading\.current\?\.focus\(\)/);
  assert.match(drilldown,/NOT AUTHORIZED/i);
});

test('QL-375 adds no source, database, enrollment or browser storage writes',()=>{
  for(const code of [catalogue,drilldown,shell]){
    assert.doesNotMatch(code,/fetch\s*\(|\.from\(|\.rpc\(|\.invoke\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(code,/localStorage|sessionStorage|indexedDB|BroadcastChannel|signInWithPassword|challengeAndVerify/);
    assert.doesNotMatch(code,/window\.open|javascript:|onClick=\{.*activate/i);
  }
  assert.match(gate,/mfa\?\.kind==='VERIFIED' && !recoveryReturn/);
  assert.match(gate,/onProtectedReadback=\{setOperatorReadback\}/);
  assert.match(catalogue,/href:'#ql370-refresh-status'/);
  assert.match(catalogue,/href:'#ql371-owner-ceremony'/);
  assert.match(guide,/id="ql371-owner-ceremony"/);
  assert.match(drilldown,/rel:'noopener noreferrer'/);
});
