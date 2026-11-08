import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const policy=read('app/src/auth/ql374OwnerEntry.ts');
const landing=read('app/src/auth/MasterOperatorEntry.tsx');
const gate=read('app/src/auth/MasterOwnerSessionGate.tsx');
const dashboard=read('app/src/auth/OwnerProgressDashboard.tsx');
const command=read('app/src/operator/Ql271CommandSurfaces.tsx');
const old331=read('app/src/operator/Ql331MasterControl.tsx');

test('QL-374 uses existing protected status without adding network, Auth or mutation permissions',()=>{
  for(const code of [policy,landing]){
    assert.doesNotMatch(code,/\.from\(|\.rpc\(|\.invoke\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(code,/fetch\s*\(|signInWithPassword|resetPasswordForEmail|challengeAndVerify/);
    assert.doesNotMatch(code,/localStorage|sessionStorage|indexedDB|BroadcastChannel/);
  }
  assert.match(dashboard,/onProtectedReadback\?\./);
  assert.match(gate,/onProtectedReadback=\{setOperatorReadback\}/);
  assert.match(gate,/mfa\?\.kind==='VERIFIED' && !recoveryReturn/);
  assert.match(gate,/authenticatedOwner && identity/);
});
test('personal entry has focus, announcement, no first-use bypass and negative permission proof',()=>{
  assert.match(landing,/heading\.current\?\.focus\(\)/);
  assert.match(landing,/aria-current=/);
  assert.match(landing,/aria-live="polite"/);
  assert.match(policy,/mayEnterCustomerOperations:false/);
  assert.match(policy,/mayActivateSource:false/);
  assert.match(policy,/heldApplicationShells===6/);
  assert.match(policy,/sessionAal2Verified/);
  assert.match(policy,/Math\.abs\(nowMs-snapshotAt\)<=120000/);
});
test('dated old preflights are archived, but original signatures and HOLD requirements survive',()=>{
  assert.match(command,/\<Ql374TruthReconciliation\//);
  for(const panel of ['Ql329MasterShellTruth','Ql331MasterControl','Ql307ProofEvidence','Ql309PilotPreflight','Ql310BatchReconciliation']){
    const needle=new RegExp(`Archived[^\\n]*[\\s\\S]{0,300}\\<${panel}`);
    assert.match(command,needle,panel);
  }
  assert.match(old331,/Historical QL-331 preflight, not a current entry gate/);
  assert.match(policy,/Each application requires its own source-specific trust/);
  assert.match(policy,/Ree and Jack must independently sign/);
  assert.match(policy,/DISCONNECTED \/ HOLD/);
});
