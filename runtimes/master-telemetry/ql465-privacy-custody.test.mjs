import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,generateKeyPairSync,randomBytes,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
 QL465_SCHEMA,projectQl465NonpersonalEvent,encryptQl465Pii,decryptQl465Pii,
 openQl465PrivacyLedger,stageQl465ConsentWithdrawal,assessQl465ConsentUse,
 stageQl465DataSubjectRequest,evaluateQl465Retention
} from './ql465-privacy-custody.mjs';
const iso=n=>new Date(n).toISOString();
const now=Date.now()-500;
const source=generateKeyPairSync('ed25519');
const fake=generateKeyPairSync('ed25519');
const pin=k=>k.publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(payload,k=source)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const scope={tenantId:'tenant_rosevear123',workspaceId:'workspace_rosevear123',
 subjectRef:'subject_opaque_abc123',purpose:'marketing_email'};
const withdrawal={schema:'rosevear.ql465.consent-withdrawal.v1',sourceId:'rosiedazzlers',
 ...scope,requestId:'request_withdraw_12345',requestedAt:iso(now-5000),
 decision:'WITHDRAW',authorityTransfer:false};
const exportRequest={schema:'rosevear.ql465.data-subject-request.v1',sourceId:'rosiedazzlers',
 ...scope,requestId:'request_export_12345',requestedAt:iso(now-3000),
 requestType:'ACCESS_EXPORT_REQUEST',authorityTransfer:false};
const fixture=()=>{const dir=mkdtempSync(join(tmpdir(),'ql465-'));const key=randomBytes(32);
 const ledger=openQl465PrivacyLedger(join(dir,'private'),key);
 return {dir,ledger,key,cleanup:()=>rmSync(dir,{recursive:true,force:true})};};
test('QL465 strict allowlist projection forbids cross-tenant, unknown keys, personal data and stale source',()=>{
 const e={schema:QL465_SCHEMA,eventId:'event_opaque_abc123',sourceId:'rosiedazzlers',
  ...scope,category:'CONSENT_REVIEW',evidenceDigest:'a'.repeat(64),
  issuedAt:iso(now-5000),privateDataIncluded:false,authorityTransfer:false};
 const input={event:e,expectedTenantId:scope.tenantId,expectedWorkspaceId:scope.workspaceId,nowMs:now};
 const ok=projectQl465NonpersonalEvent(input);
 assert.equal(ok.state,'NONPERSONAL_REVIEW_ONLY');assert.equal(ok.runtimeConnected,false);
 assert.ok(!Object.hasOwn(ok.projection,'subjectRef'));
 assert.equal(ok.projection.signedSourceVerified,false);
 for(const mutate of [
  {...e,email:'private@example.invalid'},{...e,message:'PII'},
  {...e,tenantId:'other_tenant_1234'},{...e,privateDataIncluded:true},
  {...e,issuedAt:iso(now-3600000)},{...e,sourceId:'foreign-source'}
 ]){
  const a=projectQl465NonpersonalEvent({...input,event:mutate});
  assert.equal(a.state,'HOLD');assert.equal(a.runtimeConnected,false);
  assert.equal(a.dataExported,false);
 }
});
test('QL465 AES-256-GCM encrypts only approved fields, binds tenant and requires owner role',()=>{
 const key=randomBytes(32),record={name:'Synthetic Sample',email:'not-real@example.invalid'};
 const args={record,key,...scope,recordId:'record_opaque_abc123'};
 const packet=encryptQl465Pii(args);
 assert.equal(packet.algorithm,'AES-256-GCM');
 assert.equal(packet.dataExported,false);
 assert.ok(!JSON.stringify(packet).includes('Synthetic Sample'));
 assert.equal(decryptQl465Pii({packet,key,...args,ownerApproved:false,role:'tenant_privacy_owner'}).state,'HOLD');
 assert.equal(decryptQl465Pii({packet,key,...args,ownerApproved:true,role:'operator'}).state,'HOLD');
 assert.equal(decryptQl465Pii({packet,key,...args,ownerApproved:true,role:'tenant_privacy_owner',
  tenantId:'different_tenant_123'}).state,'HOLD');
 assert.equal(decryptQl465Pii({packet,...args,key:randomBytes(32),ownerApproved:true,
  role:'tenant_privacy_owner'}).state,'HOLD');
 const good=decryptQl465Pii({packet,key,...args,ownerApproved:true,role:'tenant_privacy_owner'});
 assert.equal(good.state,'OWNER_LOCAL_DECRYPT_ONLY');
 assert.deepEqual(good.value,record);
 assert.throws(()=>encryptQl465Pii({...args,record:{cardNumber:'123456'}}),/FIELD_OR_CONTEXT/);
});
test('QL465 signed withdrawal is durable, idempotent, no restoration or provider transmission',()=>{
 const f=fixture();
 try{
  const args={ledger:f.ledger,envelope:signed(withdrawal),sourcePin:pin(source),nowMs:now};
  assert.equal(assessQl465ConsentUse({ledger:f.ledger,...scope,consentGranted:true}).state,'CONSENT_REVIEW_ONLY');
  const out=stageQl465ConsentWithdrawal(args);
  assert.equal(out.state,'CONSENT_WITHDRAWN_LOCAL_HOLD');
  assert.equal(out.providerNotified,false);
  assert.equal(out.runtimeConnected,false);
  assert.equal(assessQl465ConsentUse({ledger:f.ledger,...scope,consentGranted:true}).reason,
   'QL465_CONSENT_WITHDRAWN_BLOCK');
  assert.equal(stageQl465ConsentWithdrawal(args).duplicate,true);
  assert.equal(stageQl465ConsentWithdrawal({...args,envelope:signed({...withdrawal,requestId:'request_other_123456'})}).state,
   'CONSENT_WITHDRAWN_LOCAL_HOLD');
  assert.equal(stageQl465ConsentWithdrawal({...args,envelope:signed(withdrawal,fake)}).state,'HOLD');
  const changed={...withdrawal,tenantId:'another_tenant_1234'};
  assert.equal(stageQl465ConsentWithdrawal({...args,envelope:signed(changed,fake)}).state,'HOLD');
  const disk=readFileSync(join(f.dir,'private','ql465-withdrawal-'+f.ledger.keyForScope(scope)+'.json'),'utf8');
  assert.ok(!disk.includes(scope.subjectRef));
  assert.ok(!disk.includes('not-real@example.invalid'));
 }finally{f.cleanup()}
});
test('QL465 evidence tampering fails closed; no consent restore after corrupt receipt',()=>{
 const f=fixture();try{
  stageQl465ConsentWithdrawal({ledger:f.ledger,envelope:signed(withdrawal),
   sourcePin:pin(source),nowMs:now});
  const path=join(f.dir,'private','ql465-withdrawal-'+f.ledger.keyForScope(scope)+'.json');
  const original=JSON.parse(readFileSync(path,'utf8'));
  original.evidence.state='FAKE_RESTORED';
  writeFileSync(path,JSON.stringify(original));
  assert.equal(assessQl465ConsentUse({ledger:f.ledger,...scope,consentGranted:true}).reason,
   'QL465_CONSENT_CUSTODY_UNAVAILABLE_OR_TAMPERED');
  assert.equal(stageQl465ConsentWithdrawal({ledger:f.ledger,envelope:signed(withdrawal),
   sourcePin:pin(source),nowMs:now}).state,'HOLD');
 }finally{f.cleanup()}
});
test('QL465 export, deletion, retention requests are signed and audited, never executed',()=>{
 const f=fixture();try{
  for(const requestType of ['ACCESS_EXPORT_REQUEST','DELETION_REQUEST','RETENTION_REVIEW_REQUEST']){
   const payload={...exportRequest,requestType,requestId:'request_'+requestType.toLowerCase()+'_12345'};
   const opts={ledger:f.ledger,envelope:signed(payload),sourcePin:pin(source),nowMs:now};
   const a=stageQl465DataSubjectRequest(opts);
   assert.equal(a.state,'PRIVACY_REQUEST_RECORDED_HOLD');
   for(const k of ['dataExported','dataDeleted','retentionExecuted','providerNotified','liveDispatchAuthorized'])
    assert.equal(a[k],false);
   assert.equal(stageQl465DataSubjectRequest(opts).duplicate,true);
   assert.equal(stageQl465DataSubjectRequest({...opts,envelope:signed({...payload,requestType:'DELETE_NOW'})}).state,'HOLD');
  }
  assert.equal(stageQl465DataSubjectRequest({ledger:f.ledger,envelope:signed(exportRequest,fake),
   sourcePin:pin(source),nowMs:now}).reason,'QL465_SIGNED_PRIVACY_REQUEST_REQUIRED');
 }finally{f.cleanup()}
});
test('QL465 retention needs explicit approved bounded policy and never purges on expiry',()=>{
 const createdAt=iso(now-90*86400000);
 assert.equal(evaluateQl465Retention({createdAt,nowMs:now,retentionDays:30,
  legalHold:false,ownerAuthorized:false}).state,'HOLD');
 const due=evaluateQl465Retention({createdAt,nowMs:now,retentionDays:30,
  legalHold:false,ownerAuthorized:true});
 assert.equal(due.state,'RETENTION_REVIEW_DUE_HOLD');assert.equal(due.dataDeleted,false);
 assert.equal(due.retentionExecuted,false);assert.equal(due.scheduledDeletion,false);
 assert.equal(evaluateQl465Retention({createdAt,nowMs:now,retentionDays:30,
  legalHold:true,ownerAuthorized:true}).reason,'QL465_LEGAL_HOLD_NO_ERASURE');
 assert.equal(evaluateQl465Retention({createdAt,nowMs:now,retentionDays:100,
  legalHold:false,ownerAuthorized:true}).state,'RETENTION_POLICY_REVIEW_ONLY');
 assert.equal(evaluateQl465Retention({createdAt,nowMs:now,retentionDays:0,
  legalHold:false,ownerAuthorized:true}).state,'HOLD');
 assert.equal(evaluateQl465Retention({createdAt,nowMs:now,retentionDays:5000,
  legalHold:false,ownerAuthorized:true}).state,'HOLD');
});
