import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {PORTAL_SCHEMA,inspectPortalJourney,verifyPortalJourney,authorizePortalAccess,
  privatePortalLedger} from './journey.mjs';

const NOW=Date.parse('2026-11-05T14:00:00.000Z');
const keys=generateKeyPairSync('ed25519');
const publicKeyPem=keys.publicKey.export({type:'spki',format:'pem'});
const publicKeySha256=createHash('sha256').update(keys.publicKey.export({format:'der',type:'spki'})).digest('hex');
const sample=()=>({schemaVersion:PORTAL_SCHEMA,eventId:'evt_portalCaseOpened0001',
  eventType:'case.opened',issuer:'yard-workers',destination:'rosevear-comms-hub',
  shellId:'yw',tenantId:'rosevear-landscaping',childId:'child-sole-tenant',
  subjectRef:'ref_subject_opaque_001',caseRef:'ref_case_opaque_00001',
  consentReceiptSha256:'a'.repeat(64),ownerGrantSha256:'b'.repeat(64),
  sourceReceiptSha256:'c'.repeat(64),nonce:'aaaaaaaaaaaaaaaaaaaaaa',
  issuedAt:'2026-11-05T13:59:00.000Z',expiresAt:'2026-11-05T14:03:00.000Z',
  retentionDays:90,audience:'rosevear-comms-hub:child-portal:nonproduction',environment:'TEST'});
const signed=e=>({envelope:e,signature:sign(null,Buffer.from(canonicalize(e)),keys.privateKey).toString('base64url'),
  keyId:'portal-key-ql339'});
const grants=e=>({identityAuthenticated:true,workloadAuthenticated:true,sourceOwnerTestApproved:true,
  commsOwnerTestApproved:true,originalIssuerWitnessed:true,signerIndependentlyPinned:true,
  signedSourceReceiptVerified:true,ownerGrantVerified:true,childDelegationVerified:true,
  consentReceiptVerified:true,
  consentActive:true,sessionValid:true,issuer:e.issuer,shellId:e.shellId,tenantId:e.tenantId,
  childId:e.childId,subjectRef:e.subjectRef,consentReceiptSha256:e.consentReceiptSha256,
  ownerGrantSha256:e.ownerGrantSha256,sourceReceiptSha256:e.sourceReceiptSha256,
  audience:e.audience,pinnedKeyId:'portal-key-ql339',pinnedPublicKeyPem:publicKeyPem,
  pinnedPublicKeySha256:publicKeySha256});
const verify=(editE=()=>{},editTrust=()=>{})=>{
  const e=sample(),t=grants(e);editE(e);editTrust(t);
  return verifyPortalJourney(signed(e),t,NOW).decision;
};

test('strict minimal metadata contract excludes customer fields and unknown event types',()=>{
  assert.equal(inspectPortalJourney({...sample(),customerName:'Do not store'},NOW).decision,
    'DENY_SCHEMA_OR_CUSTOMER_PAYLOAD');
  for(const patch of [{eventType:'sms.send'},{environment:'production'},
    {issuer:'icamp'},{childId:'../other'},{subjectRef:'person@example.com'},
    {retentionDays:366},{retentionDays:0},{audience:'other'}])
    assert.equal(inspectPortalJourney({...sample(),...patch},NOW).decision,'DENY_SOURCE_SCOPE_OR_RETENTION');
  assert.equal(inspectPortalJourney({...sample(),expiresAt:'2026-11-05T13:59:59.000Z'},NOW).decision,
    'HOLD_EXPIRED_OR_FUTURE');
  assert.equal(inspectPortalJourney({...sample(),issuedAt:'2026-11-05T14:00:20.000Z',
    expiresAt:'2026-11-05T14:00:10.000Z'},NOW).decision,'HOLD_EXPIRED_OR_FUTURE');
});

test('source signature, provenance, exact child, active consent and real owner gates required',()=>{
  assert.equal(verify(),'VERIFIED_PRIVATE_RECEIPT_HELD');
  for(const flag of ['identityAuthenticated','workloadAuthenticated','sourceOwnerTestApproved',
    'commsOwnerTestApproved','originalIssuerWitnessed','signerIndependentlyPinned',
    'signedSourceReceiptVerified','ownerGrantVerified','childDelegationVerified',
    'consentReceiptVerified','sessionValid'])
    assert.equal(verify(()=>{},t=>{t[flag]=false}),'HOLD_MISSING_OR_REVOKED_CHILD_AUTHORITY',flag);
  for(const flag of ['sessionRevoked','roleRevoked','grantRevoked'])
    assert.equal(verify(()=>{},t=>{t[flag]=true}),'HOLD_MISSING_OR_REVOKED_CHILD_AUTHORITY',flag);
  for(const field of ['tenantId','childId','shellId','subjectRef','ownerGrantSha256'])
    assert.equal(verify(()=>{},t=>{t[field]='other'}),'HOLD_MISSING_OR_REVOKED_CHILD_AUTHORITY',field);
  assert.equal(verify(()=>{},t=>{t.consentActive=false}),'HOLD_CONSENT_NOT_ACTIVE');
  const tampered=sample(),originalSignature=signed(tampered);
  originalSignature.envelope.caseRef='ref_other_case_000000';
  assert.equal(verifyPortalJourney(originalSignature,grants(tampered),NOW).decision,'DENY_SIGNATURE');
  assert.equal(verify(()=>{},t=>{t.pinnedKeyId='portal-key-other'}),'DENY_UNPINNED_SIGNER');
  assert.equal(verify(()=>{},t=>{t.peerStatus=403}),'DENY_AUTHENTICATION_OR_ORIGIN');
});

test('signed revocation events may be recorded without active consent, but cannot send',()=>{
  for(const eventType of ['consent.revoked','session.revoked']){
    const e={...sample(),eventType},v=verifyPortalJourney(signed(e),{...grants(e),consentActive:false},NOW);
    assert.equal(v.decision,'VERIFIED_PRIVATE_RECEIPT_HELD');
    assert.equal(v.communicationsSent,0);
    assert.equal(v.livePortal,false);
  }
});

test('read/export/erasure deny wrong shell, child, session, consent and operation scope',()=>{
  const e=sample();const request={operation:'read',shellId:e.shellId,tenantId:e.tenantId,
    childId:e.childId,subjectRef:e.subjectRef};
  const trust={...grants(e),childDelegationVerified:true};
  assert.equal(authorizePortalAccess(request,trust).decision,'AUTHORIZED_PRIVATE_SCOPE_ONLY');
  for(const changed of [{childId:'other-child'},{shellId:'icamp'},
    {subjectRef:'ref_other_subject_001'},{tenantId:'other-tenant'}])
    assert.equal(authorizePortalAccess({...request,...changed},trust).decision,
      'DENY_CROSS_CHILD_OR_REVOKED_SESSION');
  assert.equal(authorizePortalAccess({...request,operation:'export'},trust).decision,
    'DENY_MISSING_OPERATION_CONSENT');
  assert.equal(authorizePortalAccess({...request,operation:'delete-request'},trust).decision,
    'DENY_MISSING_OPERATION_CONSENT');
  assert.equal(authorizePortalAccess(request,{...trust,sessionRevoked:true}).decision,
    'DENY_CROSS_CHILD_OR_REVOKED_SESSION');
  assert.equal(authorizePortalAccess(request,{...trust,consentActive:false}).decision,
    'DENY_MISSING_OPERATION_CONSENT');
  assert.equal(authorizePortalAccess({...request,operation:'read-all'},trust).decision,'DENY_ACCESS_SCOPE');
});

function memory(){
  const state={events:new Map(),nonce:new Set(),lastRead:null};
  const transaction=async fn=>fn({query:async(sql,args)=>{
    if(sql.includes('INSERT INTO public.master_client_portal_journeys_ql339')){
      const key=args.slice(0,3).join(':')+':'+args[5],nonce=args[0]+':'+args[7];
      if(state.events.has(key)||state.nonce.has(nonce))return {rows:[]};
      state.events.set(key,{event_sha256:args[11]});state.nonce.add(nonce);
      return {rows:[{journey_id:'test-only'}]};
    }
    if(sql.includes('SELECT event_sha256')){
      const v=state.events.get(args.join(':'));return {rows:v?[v]:[]};
    }
    if(sql.includes('SELECT event_id')){
      assert.match(sql,/WHERE shell_id=\$1 AND tenant_id=\$2 AND child_id=\$3 AND subject_ref=\$4/);
      assert.match(sql,/retention_until>now\(\)/);
      state.lastRead=args;return {rows:[]};
    }
    throw new Error('UNEXPECTED_QUERY');
  }});
  return {state,transaction};
}

test('one held receipt per event, no duplicate effects, and tenant-bounded SQL read',async()=>{
  const m=memory(),ledger=privatePortalLedger(m.transaction),e=sample(),p=signed(e),t=grants(e);
  assert.equal((await ledger.receive(p,t,NOW)).decision,'RECORDED_ONE_PRIVATE_HELD_RECEIPT');
  assert.equal((await ledger.receive(p,t,NOW)).decision,'DUPLICATE_NO_EFFECT');
  assert.equal(m.state.events.size,1);
  const conflict=signed({...e,caseRef:'ref_case_opaque_other'});
  assert.equal((await ledger.receive(conflict,t,NOW)).decision,'HOLD_EVENT_ID_CONFLICT');
  const nonce=signed({...e,eventId:'evt_anotherCaseEvent01'});
  assert.equal((await ledger.receive(nonce,t,NOW)).decision,'HOLD_NONCE_REPLAY_OR_SCOPE_CONFLICT');
  const request={operation:'read',shellId:e.shellId,tenantId:e.tenantId,
    childId:e.childId,subjectRef:e.subjectRef};
  assert.equal((await ledger.scopedRead(request,{...t,childDelegationVerified:true})).decision,'PRIVATE_SCOPE_READ_ONLY');
  assert.deepEqual(m.state.lastRead,[e.shellId,e.tenantId,e.childId,e.subjectRef]);
  assert.equal((await ledger.scopedRead({...request,operation:'export'},
    {...t,childDelegationVerified:true})).decision,'DENY_MISSING_OPERATION_CONSENT');
});

test('private ledger requires server transaction; public app cannot import Node runtime',()=>{
  assert.throws(()=>privatePortalLedger(null),/PRIVATE_ATOMIC_TRANSACTION_REQUIRED/);
});
