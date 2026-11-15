import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl459RegistryLedger} from './ql459-registry-enrollment-handoff.mjs';
import {APPS,MASTERS,TOPOLOGY,openQl460FederationLedger,readQl460Federation,
 runQl460FederationReview} from './ql460-zero-trust-workload-federation.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({type:'spki',format:'der'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const incidentId='ql460_original_incident_123456';
const ROLES=['MASTER_CONTROLLER','MASTER_WITNESS','MASTER_COMMS','CAMPGROUND_SHELL',
 'WORKFORCE_SHELL','COMMERCE_COMPANY','DETAILING_COMPANY'];
function fixture({priorException=false,revoked=false,tokenExpired=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql460-')),now=Date.now()-500;
 const ql459Ledger=openQl459RegistryLedger(join(root,'ql459'));
 const federationLedger=openQl460FederationLedger(join(root,'ql460'));
 const pending=ql459Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const previous=ql459Ledger.claimOnce(priorException?'exception':'review',incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL459_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN':
   'DURABLE_QL459_SOURCE_HANDOFF_REVIEW_ONLY',
  originalIncidentId:incidentId,batchId:'ql459_old_batch_abc12345',
  challengeNonce:'ql459_old_nonce_abc12345',connection:'HOLD',incidentStatus:'OPEN',
  activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
  masterCount:3,sourceCount:7,ownerAcceptance:'DUAL_SIGNED_SOURCE_HANDOFF_OPEN_HOLD',
  pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:previous.recordDigest,
  registryDigest:'c'.repeat(64),enrollmentDigest:'d'.repeat(64),
  manifestDigest:'e'.repeat(64),masterReportsDigest:'f'.repeat(64),
  classification:priorException?'SIGNED_PREVIOUS_EXCEPTION_OR_SOURCE_DENIAL_OPEN':
   'SIGNED_SEVEN_APP_REGISTRY_HANDOFF_REVIEW_ONLY',
  closureDecision:priorException?'ESCALATE_SIGNED_SOURCE_DENIAL_KEEP_OPEN_HOLD':
   'REVIEW_SOURCE_ENROLLMENTS_KEEP_OPEN_HOLD'};
 const batchId='ql460_new_batch_abc12345',challengeNonce='ql460_new_nonce_abc12345';
 const issuerKeys=Object.fromEntries(APPS.map(a=>[a,key()]));
 const workloadKeys=Object.fromEntries(APPS.map(a=>[a,key()]));
 const masterKeys=Object.fromEntries(MASTERS.map(a=>[a,key()]));
 const owners={source:key(),master:key()};
 const expectedMainShas=Object.fromEntries(APPS.map((a,i)=>[a,(i+1).toString(16).repeat(40)]));
 const issuerPayloads=APPS.map((app,i)=>({
  schema:'rosevear.ql460.issuer-lifecycle.v1',incidentId,batchId,challengeNonce,
  ql459ReceiptDigest:previous.recordDigest,registryDigest:prior.registryDigest,
  appId:app,role:ROLES[i],repoFullName:'RosevearCreations/'+app,
  sourceMainSha:expectedMainShas[app],keyPin:workloadKeys[app].pin,
  issuerId:'ql460_issuer_'+i+'_abc123456',credentialId:'ql460_cert_'+i+'_abc123456',
  generation:2,priorCredentialDigest:(i+1).toString(16).repeat(64),
  revokedPriorPinDigest:(i+2).toString(16).repeat(64),
  revokedPriorAt:iso(now-14000),scope:'SOURCE_READ_ONLY',
  tenantBoundary:'ISOLATED_READ_ONLY',audiences:[...MASTERS],
  issuedAt:iso(now-12000),expiresAt:iso(now+7000),
  issuerDisposition:revoked&&i===6?'SIGNED_REVOKED_OPEN_HOLD':'HISTORICAL_ACTIVE_HELD',
  authorityTransfer:false}));
 const issuers=issuerPayloads.map(p=>signed(p,issuerKeys[p.appId]));
 const issuerSetDigest=hash(issuerPayloads);
 const tokenPayloads=APPS.flatMap((app,i)=>MASTERS.map((audience,j)=>({
  schema:'rosevear.ql460.workload-proof.v1',incidentId,batchId,challengeNonce,
  ql459ReceiptDigest:previous.recordDigest,issuerDigest:hash(issuerPayloads[i]),
  appId:app,sourceMainSha:expectedMainShas[app],audience,
  tokenId:'ql460_token_'+i+'_'+j+'_abc123456',
  subjectId:'ql460_subject_'+i+'_abc123456',operation:'SOURCE_READ_ONLY',
  tenantBoundary:'ISOLATED_READ_ONLY',scope:'SOURCE_READ_ONLY',
  notBefore:iso(now-9000),expiresAt:iso(now+(tokenExpired&&i===6&&j===2?-100:5000)),
  signedAt:iso(now-5000),runtimeConnection:'UNVERIFIED_HOLD',
  authorityTransfer:false})));
 const tokens=tokenPayloads.map(p=>signed(p,workloadKeys[p.appId]));
 const routeProofDigest=hash(tokenPayloads);
 const exception=priorException||revoked||tokenExpired;
 const classification=exception?'SIGNED_ISSUER_REVOKED_PRIOR_EXCEPTION_OR_EXPIRY_OPEN':
  'SIGNED_SEVEN_APP_TO_THREE_MASTER_READONLY_PROOF_ONLY';
 const decision=exception?'ESCALATE_ISSUER_OR_AUDIENCE_EXCEPTION_KEEP_OPEN_HOLD':
  'REVIEW_READONLY_AUDIENCE_PROOFS_KEEP_OPEN_HOLD';
 const votePayloads=MASTERS.map(masterId=>({
  schema:'rosevear.ql460.master-federation-review.v1',incidentId,batchId,
  masterId,issuerSetDigest,routeProofDigest,classification,decision,
  incidentStatus:'OPEN_HOLD',attestedAt:iso(now-3000)}));
 const votes=votePayloads.map(p=>signed(p,masterKeys[p.masterId]));
 const ownerPayload={schema:'rosevear.ql460.owner-federation.v1',incidentId,batchId,
  sourceOwnerId:'Source_Owner_ql460',masterOwnerId:'Master_Owner_ql460',
  issuerSetDigest,routeProofDigest,masterDigest:hash(votePayloads),
  classification,decision,incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-2000)};
 const ownerDecision={payload:ownerPayload,
  sourceOwnerSignature:signed(ownerPayload,owners.source).signature,
  masterOwnerSignature:signed(ownerPayload,owners.master).signature};
 const env={issuers,tokens,votes,ownerDecision};
 const args={ql459Summary:prior,ql459Ledger,federationLedger,batchId,challengeNonce,
  independentIssuerProvider:{readSignedIssuerLifecycle:async()=>env.issuers},
  sevenAppWorkloadProvider:{readSignedMasterAudienceProofs:async()=>env.tokens},
  threeMasterProvider:{readSignedFederationVotes:async()=>env.votes},
  finalOwnerDecision:ownerDecision};
 const opts={nowMs:now,readTrustedNowMs:()=>now,
  trustedClockVerified:true,independentQl459CustodyVerified:true,
  originalReceiverHeldAndIsolated:true,issuerPinsIndependentlyEnrolled:true,
  workloadPinsIndependentlyEnrolled:true,tenantPolicyVerified:true,
  topology:TOPOLOGY,trustedRegistryDigest:prior.registryDigest,
  issuerPins:Object.fromEntries(APPS.map(a=>[a,issuerKeys[a].pin])),
  workloadPins:Object.fromEntries(APPS.map(a=>[a,workloadKeys[a].pin])),
  masterPins:Object.fromEntries(MASTERS.map(a=>[a,masterKeys[a].pin])),
  sourceOwnerPin:owners.source.pin,masterOwnerPin:owners.master.pin,
  expectedMainShas};
 return {root,now,prior,ql459Ledger,federationLedger,batchId,challengeNonce,issuerKeys,
  workloadKeys,masterKeys,owners,expectedMainShas,issuerPayloads,tokenPayloads,
  votePayloads,ownerPayload,env,args,opts,run:()=>runQl460FederationReview(args,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true}),
  setOwner(p){args.finalOwnerDecision={payload:p,
   sourceOwnerSignature:signed(p,owners.source).signature,
   masterOwnerSignature:signed(p,owners.master).signature};}};
}
async function rejected(change,reason,config={}){
 const f=fixture(config);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.activationAuthorized,false);assert.equal(r.closureAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.runtimeConnected,false);
 }finally{f.cleanup();}
}
test('QL460 independently signed 7 issuer credentials and 21 scoped master audience proofs remain historical OPEN/HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL460_SIGNED_ROUTE_REVIEW_ONLY',r.reason);
  assert.equal(r.sourceCount,7);assert.equal(r.audienceProofCount,21);
  assert.equal(r.sourceDenials,0);assert.equal(r.masterCount,3);
  assert.equal(r.runtimeConnected,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl460Federation(f.federationLedger,incidentId).state,
   'QL460_DURABLE_SIGNED_ROUTE_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL460_ONE_USE_NONCE_REPLAY');
 }finally{f.cleanup();}
});
test('QL460 prior signed exceptions, issuer revocation and expired audience tokens cannot silently become healthy',async()=>{
 for(const cfg of [{priorException:true},{revoked:true},{tokenExpired:true}]){
  const f=fixture(cfg);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL460_ROUTE_OR_ISSUER_EXCEPTION_OPEN',r.reason);
   assert.equal(r.runtimeConnected,false);assert.equal(r.closureAuthorized,false);
   assert.equal(readQl460Federation(f.federationLedger,incidentId).state,
    'QL460_DURABLE_ROUTE_OR_ISSUER_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL460 requires prior QL459 immutable custody, trusted pins, exact external SHAs and isolated original host',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL460_ORIGINAL_QL459_TRUST_AND_HOLD_REQUIRED');
 await rejected(f=>{f.prior.finalReceiptDigest='0'.repeat(64);},
  'QL460_ORIGINAL_QL459_TRUST_AND_HOLD_REQUIRED');
 await rejected(f=>{f.opts.originalReceiverHeldAndIsolated=false;},
  'QL460_ORIGINAL_QL459_TRUST_AND_HOLD_REQUIRED');
 await rejected(f=>{f.opts.topology='fake';},
  'QL460_NINETEEN_INDEPENDENT_PINS_OR_SOURCE_REGISTRY_INVALID');
 await rejected(f=>{f.opts.trustedRegistryDigest='f'.repeat(64);},
  'QL460_NINETEEN_INDEPENDENT_PINS_OR_SOURCE_REGISTRY_INVALID');
 await rejected(f=>{f.opts.workloadPins.iCamp=f.opts.workloadPins.yw;},
  'QL460_NINETEEN_INDEPENDENT_PINS_OR_SOURCE_REGISTRY_INVALID');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL460_ORIGINAL_QL459_TRUST_AND_HOLD_REQUIRED');
});
test('QL460 issuer identities reject forged keys, tenant privilege, revocation evidence, rotation and audience drift',async()=>{
 await rejected(f=>{f.env.issuers.pop();},'QL460_SEVEN_INDEPENDENT_ISSUER_RECORDS_REQUIRED');
 await rejected(f=>{[f.env.issuers[2],f.env.issuers[3]]=[f.env.issuers[3],f.env.issuers[2]];},
  'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.issuers[4]=signed({...f.issuerPayloads[4],scope:'WRITE_ALL'},
  f.issuerKeys.yw);},'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.issuers[5]=signed({...f.issuerPayloads[5],tenantBoundary:'SHARED'},
  f.issuerKeys['devilndove-site']);},'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.issuers[6]=signed({...f.issuerPayloads[6],audiences:['ai-data-platform']},
  f.issuerKeys.rosiedazzlers);},'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.issuers[1]=signed({...f.issuerPayloads[1],generation:1},
  f.issuerKeys['rosevear-ai-hub']);},'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.issuers[0].signature=f.env.issuers[1].signature;},
  'QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
});
test('QL460 workload rejects master impersonation, wrong audience, token replay, expiry, caller privilege and fake CONNECTED',async()=>{
 await rejected(f=>{f.env.tokens.pop();},'QL460_TWENTYONE_DISTINCT_AUDIENCE_PROOFS_REQUIRED');
 await rejected(f=>{f.env.tokens[20]=signed({...f.tokenPayloads[20],audience:'yw'},
  f.workloadKeys.rosiedazzlers);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[19]=signed({...f.tokenPayloads[19],operation:'TENANT_WRITE'},
  f.workloadKeys.rosiedazzlers);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[18]=signed({...f.tokenPayloads[18],runtimeConnection:'CONNECTED'},
  f.workloadKeys.rosiedazzlers);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[10]=signed({...f.tokenPayloads[10],tokenId:f.tokenPayloads[0].tokenId},
  f.workloadKeys.iCamp);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[17].signature=f.env.tokens[0].signature;},
  'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[9]=signed({...f.tokenPayloads[9],expiresAt:iso(f.now+65000)},
  f.workloadKeys.iCamp);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
 await rejected(f=>{f.env.tokens[5]=signed({...f.tokenPayloads[5],tenantBoundary:'SHARED'},
  f.workloadKeys['rosevear-ai-hub']);},'QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
});
test('QL460 three-master and independently signed two-owner veto reject falsely closed incidents',async()=>{
 await rejected(f=>{f.env.votes.pop();},'QL460_THREE_INDEPENDENT_MASTERS_REQUIRED');
 await rejected(f=>{f.env.votes[1].signature=f.env.votes[0].signature;},
  'QL460_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.setOwner({...f.ownerPayload,incidentStatus:'CLOSED'});},
  'QL460_DUAL_OWNER_SIGNED_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL460_DUAL_OWNER_SIGNED_VETO');
});
test('QL460 final commit clock blocks future expiry, backwards trusted time and stale owner evidence',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+6000;},
  'QL460_LIVE_ATTESTATION_EXPIRED_DURING_REVIEW');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+61000;},'QL460_TRUSTED_CLOCK_DRIFT');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-100;},'QL460_TRUSTED_CLOCK_DRIFT');
});
test('QL460 failed source intake preserves one-use pending; corrupted private ledger never returns healthy',async()=>{
 const f=fixture();try{
  f.args.independentIssuerProvider.readSignedIssuerLifecycle=async()=>{throw Error('offline')};
  assert.equal((await f.run()).reason,'QL460_SIGNED_ISSUER_SOURCE_UNAVAILABLE');
  assert.equal(readQl460Federation(f.federationLedger,incidentId).reason,
   'QL460_MANUAL_INTERRUPTED_REVIEW_REQUIRED');
  assert.equal((await f.run()).reason,'QL460_ONE_USE_NONCE_REPLAY');
  writeFileSync(join(f.root,'ql460','ql460-pending-'+incidentId+'.json'),'{}');
  assert.equal(readQl460Federation(f.federationLedger,incidentId).reason,
   'QL460_PRIVATE_CUSTODY_UNREADABLE');
 }finally{f.cleanup();}
 assert.throws(()=>openQl460FederationLedger('relative'),/ABSOLUTE_PRIVATE_DIRECTORY/);
});
