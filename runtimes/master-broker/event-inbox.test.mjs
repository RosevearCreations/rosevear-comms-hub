import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {BROKER_EVENT_SCHEMA,canonicalBrokerEvent,inspectBrokerEvent,verifyBrokerDelivery,privateBrokerInbox} from './event-inbox.mjs';

const NOW=Date.parse('2026-11-05T13:00:00.000Z');
const key=generateKeyPairSync('ed25519');
const publicKeyPem=key.publicKey.export({format:'pem',type:'spki'});
const keyDigest=createHash('sha256').update(key.publicKey.export({format:'der',type:'spki'})).digest('hex');
const sha=c=>c.repeat(64);
const sample=()=>({
  schemaVersion:BROKER_EVENT_SCHEMA,eventId:'evt_ql337CaseMessage001',eventType:'case.handoff.requested',
  traceId:randomUUID(),sourceApplicationId:'ai-data-platform',originApplicationId:'yard-workers',
  destinationApplicationId:'rosevear-comms-hub',sourceShell:'yw',tenantId:'rosevear-landscaping',
  childId:'child-original',audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  sourceReceiptSha256:sha('a'),consentSha256:sha('b'),payloadRef:'ref_case_review_001',
  nonce:'aaaaaaaaaaaaaaaaaaaaaa',issuedAt:'2026-11-05T12:59:00.000Z',
  expiresAt:'2026-11-05T13:03:00.000Z'
});
const packet=(envelope)=>({envelope,signature:sign(null,Buffer.from(canonicalBrokerEvent(envelope)),
  key.privateKey).toString('base64url'),keyId:'broker-key-ql337'});
const trust=(e)=>({
  authenticated:true,workloadVerified:true,originIndependentlyPinned:true,keyEpochValid:true,
  sourceRouteReviewed:true,nonproductionDeliveryApproved:true,sourceSignerIndependentlyPinned:true,
  sourceOwnerTestAuthorized:true,ownerTestAuthorized:true,signedSourceReceiptVerified:true,
  childIsolationVerified:true,consentProofVerified:true,peerHttpStatus:200,
  sourceReceiptSha256:e.sourceReceiptSha256,consentSha256:e.consentSha256,
  tenantId:e.tenantId,childId:e.childId,sourceShell:e.sourceShell,
  originApplicationId:e.originApplicationId,workloadAudience:'rosevear-comms-hub:nonproduction',
  pinnedKeyId:'broker-key-ql337',pinnedPublicKeyPem:publicKeyPem,pinnedPublicKeySha256:keyDigest
});
const verdict=(mutatePacket=()=>{},mutateTrust=()=>{})=>{
  const e=sample(),p=packet(e),t=trust(e);mutatePacket(p);mutateTrust(t);
  return verifyBrokerDelivery(p,t,NOW);
};

test('signed, metadata-only TEST case verifies with independently pinned issuer and every grant',()=>{
  const e=sample(),v=verifyBrokerDelivery(packet(e),trust(e),NOW);
  assert.equal(v.decision,'VERIFIED_FOR_PRIVATE_INBOX');
  assert.equal(v.effectKind,'CASE_REVIEW_HELD');
  assert.equal(v.liveDelivery,false);
  assert.equal(v.communicationsSent,0);
  assert.equal(v.customerDataTransferred,0);
  assert.equal(v.envelopeSha256.length,64);
});

test('AI Data Platform and Comms canonical envelope bytes match independent verifier',()=>{
  const e={...sample(),traceId:'00000000-0000-4000-8000-000000000001'};
  assert.equal(createHash('sha256').update(canonicalBrokerEvent(e)).digest('hex'),
    'af38fb0956b2905f5c89a655959d64760af375f677354d18b86910200e3b6599');
});

test('exact schema refuses unsupported versions, data payloads, and cross-app destinations',()=>{
  assert.equal(inspectBrokerEvent({...sample(),unexpectedPII:'person@example.com'},NOW).decision,'DENY_EVENT_SCHEMA');
  for(const patch of [{schemaVersion:'rosevear.broker.comms.event.v2'},
    {destinationApplicationId:'other-app'},{environment:'production'},{eventType:'sms.send'},
    {sourceShell:'devilndove',originApplicationId:'yard-workers'},
    {payloadRef:{name:'customer'}},{childId:'../other-child'}]){
    assert.equal(inspectBrokerEvent({...sample(),...patch},NOW).decision,'DENY_EVENT_FIELDS_OR_SCOPE');
  }
});

test('future, expired and excessive validity reject even correctly signed packets',()=>{
  assert.equal(inspectBrokerEvent({...sample(),expiresAt:'2026-11-05T12:59:59.000Z'},NOW).decision,'HOLD_EVENT_EXPIRED_OR_FUTURE');
  assert.equal(inspectBrokerEvent({...sample(),issuedAt:'2026-11-05T13:05:00.000Z'},NOW).decision,'HOLD_EVENT_EXPIRED_OR_FUTURE');
  assert.equal(inspectBrokerEvent({...sample(),expiresAt:'2026-11-05T13:15:00.000Z'},NOW).decision,'HOLD_EVENT_EXPIRED_OR_FUTURE');
});

test('forgery, swapped tenant/child, wrong audience, wrong issuer and wrong key all deny',()=>{
  assert.equal(verdict(p=>{p.signature='A'.repeat(86)}).decision,'DENY_INVALID_BROKER_SIGNATURE');
  assert.equal(verdict(p=>{p.envelope.tenantId='other-tenant'}).decision,'HOLD_UNVERIFIED_BROKER_OR_SOURCE_AUTHORITY');
  assert.equal(verdict(p=>{p.envelope.childId='other-child'}).decision,'HOLD_UNVERIFIED_BROKER_OR_SOURCE_AUTHORITY');
  assert.equal(verdict(p=>{p.envelope.audience='other-service'}).decision,'DENY_EVENT_FIELDS_OR_SCOPE');
  assert.equal(verdict(p=>{p.envelope.sourceApplicationId='untrusted'}).decision,'DENY_EVENT_FIELDS_OR_SCOPE');
  assert.equal(verdict(()=>{},t=>{t.pinnedKeyId='broker-key-other'}).decision,'DENY_UNPINNED_SIGNER');
  assert.equal(verdict(()=>{},t=>{t.pinnedPublicKeySha256=sha('c')}).decision,'DENY_INVALID_BROKER_SIGNATURE');
});

test('401/403, redirect, rollback, missing consent or source grants fail closed',()=>{
  for(const status of [401,403])assert.equal(verdict(()=>{},t=>{t.peerHttpStatus=status}).decision,'HOLD_PEER_IDENTITY_DENIED');
  assert.equal(verdict(()=>{},t=>{t.redirected=true}).decision,'DENY_UNPINNED_ORIGIN');
  assert.equal(verdict(()=>{},t=>{t.rollbackInProgress=true}).decision,'HOLD_BROKER_ROLLBACK');
  for(const flag of ['authenticated','workloadVerified','sourceSignerIndependentlyPinned','sourceOwnerTestAuthorized',
    'ownerTestAuthorized','signedSourceReceiptVerified','childIsolationVerified','consentProofVerified',
    'originIndependentlyPinned','keyEpochValid','sourceRouteReviewed','nonproductionDeliveryApproved']){
    assert.equal(verdict(()=>{},t=>{t[flag]=false}).decision,
      'HOLD_UNVERIFIED_BROKER_OR_SOURCE_AUTHORITY',flag);
  }
});

function memoryLedger({failEffect=false}={}){
  const state={events:new Map(),nonces:new Set(),effects:new Set()};
  return {state,transaction:async task=>{
    const staged={events:new Map(state.events),nonces:new Set(state.nonces),effects:new Set(state.effects)};
    const tx={query:async(sql,args)=>{
      if(sql.includes('INSERT INTO public.master_broker_event_inbox_ql337')){
        const [source,origin,shell,tenant,child,eventId,type,trace,nonce,srcReceipt,consent,hash,payload]=args;
        if(staged.events.has(source+':'+eventId)||staged.nonces.has(source+':'+nonce))return {rows:[]};
        const inboxId=randomUUID();
        staged.events.set(source+':'+eventId,{inboxId,envelope_sha256:hash,origin,shell,tenant,child,type,trace,srcReceipt,consent,payload});
        staged.nonces.add(source+':'+nonce);
        return {rows:[{inbox_id:inboxId}]};
      }
      if(sql.includes('SELECT envelope_sha256 FROM public.master_broker_event_inbox_ql337')){
        const row=staged.events.get(args[0]+':'+args[1]);
        return {rows:row?[{envelope_sha256:row.envelope_sha256}]:[]};
      }
      if(sql.includes('INSERT INTO public.master_broker_effect_receipts_ql337')){
        if(failEffect)throw new Error('SIMULATED_TRANSACTION_FAILURE');
        staged.effects.add(args[0]+':'+args[1]);return {rows:[]};
      }
      throw new Error('UNEXPECTED_QUERY');
    }};
    const value=await task(tx);
    state.events=staged.events;state.nonces=staged.nonces;state.effects=staged.effects;
    return value;
  }};
}

test('atomic inbox reserves only one HOLD effect under duplicate and conflicted event replay',async()=>{
  const m=memoryLedger(),inbox=privateBrokerInbox(m.transaction);
  const e=sample(),p=packet(e),t=trust(e);
  assert.equal((await inbox.receive(p,t,NOW)).decision,'RECORDED_ONE_HELD_EFFECT');
  assert.equal((await inbox.receive(p,t,NOW)).decision,'DUPLICATE_NO_EFFECT');
  assert.equal(m.state.events.size,1);assert.equal(m.state.effects.size,1);
  const conflict=packet({...e,payloadRef:'ref_case_review_002'});
  assert.equal((await inbox.receive(conflict,t,NOW)).decision,'HOLD_EVENT_ID_CONFLICT');
  const nonceReplay=packet({...e,eventId:'evt_ql337DifferentId002'});
  assert.equal((await inbox.receive(nonceReplay,t,NOW)).decision,'HOLD_NONCE_REPLAY_OR_SCOPE_CONFLICT');
  assert.equal(m.state.effects.size,1);
});

test('effect insertion failure rolls back reservation and has no partial ledger effect',async()=>{
  const m=memoryLedger({failEffect:true}),inbox=privateBrokerInbox(m.transaction),e=sample();
  await assert.rejects(()=>inbox.receive(packet(e),trust(e),NOW),/SIMULATED_TRANSACTION_FAILURE/);
  assert.equal(m.state.events.size,0);assert.equal(m.state.effects.size,0);
});

test('untrusted callers cannot open a private ledger',()=>{
  assert.throws(()=>privateBrokerInbox(null),/PRIVATE_ATOMIC_TRANSACTION_REQUIRED/);
});

test('database ledger is append-only, forced RLS, unique and never grants browser access',()=>{
  const sql=readFileSync(new URL('../../supabase/migrations/20261105132334_ql337_private_broker_inbox_no_delivery.sql',import.meta.url),'utf8');
  for(const token of ['ql337_event_id_once UNIQUE','ql337_nonce_once UNIQUE',
    'ql337_one_effect_per_event UNIQUE','FORCE ROW LEVEL SECURITY',
    'ql334_reject_evidence_mutation','delivery_state=\'HOLD\'','effect_state=\'HOLD\'']){
    assert.ok(sql.includes(token),`missing ${token}`);
  }
  assert.equal((sql.match(/FORCE ROW LEVEL SECURITY/g)||[]).length,2);
  assert.equal((sql.match(/REVOKE ALL ON public\.master_broker_/g)||[]).length,2);
  assert.doesNotMatch(sql,/GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE)\s+ON/);
});
