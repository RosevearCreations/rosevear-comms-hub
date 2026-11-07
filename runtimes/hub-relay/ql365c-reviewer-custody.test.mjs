import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {hashWitnessFiles} from './ql340b-enrollment.mjs';
import {createQl365aFirstTrustRequest,signQl365aFirstTrustRequest,
  assembleQl365aFirstTrust,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {signQl365bOwnerReview,verifyQl365bOwnerReviews,
  QL365B_DECISION_SCHEMA} from './ql365b-original-reconciliation.mjs';
import {QL365C_PROOF,QL365C_CUSTODY,prepareQl365cReviewerEnrollment,
  recordQl365cProvisionalEnrollment,verifyQl365cDecisionCustody,
  assessQl365cSupervisedTestPreflight} from './ql365c-reviewer-custody.mjs';
import {ql365cCli} from './ql365c-original-preflight-cli.mjs';

const sha=v=>createHash('sha256').update(v).digest('hex');
const now=Date.parse('2026-11-07T19:00:00.000Z');
const passphrase='QL365C-synthetic-test-passphrase';
const roles=['policy_reviewer','field_witness'];
const makeSig=(payload,key)=>sign(null,Buffer.from(canonicalize(payload)),key).toString('base64url');

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'ql365c-synthetic-'));
  const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',passphrase});
  const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',passphrase});
  const sourceBytes=Buffer.from(JSON.stringify(source.publicCandidate,null,2)+'\n');
  const masterBytes=Buffer.from(JSON.stringify(master.publicCandidate,null,2)+'\n');
  const pins={source:{keyId:source.publicCandidate.keyId,
    spkiSha256:source.publicCandidate.spkiSha256,originalFileSha256:sha(sourceBytes)},
    master:{keyId:master.publicCandidate.keyId,
      spkiSha256:master.publicCandidate.spkiSha256,originalFileSha256:sha(masterBytes)}};
  const pair=generateKeyPairSync('ed25519');
  const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
    deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
    devicePublicKeyPem:pair.publicKey.export({format:'pem',type:'spki'}),
    deviceSpkiSha256:sha(pair.publicKey.export({format:'der',type:'spki'})),
    enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
  const evidencePaths={};
  for(const [i,role] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    const path=join(dir,`${role}.json`);
    writeFileSync(path,JSON.stringify({schema:'SYNTHETIC_ONLY',role,body:'x'.repeat(70+i)}));
    evidencePaths[role]=path;
  }
  const off={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(now-10_000).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,evidenceDigests:hashWitnessFiles(evidencePaths),
    receiverOffObserved:true,originalReceiverStopped:false,
    originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,
    databaseEnrollmentCreated:false,connected:false,
    customerCommunications:false,deviceActions:false};
  const request=createQl365aFirstTrustRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,sourceOriginalBytes:sourceBytes,evidencePaths,
    offObservation:off,offObservationBytes:Buffer.from(JSON.stringify(off,null,2)+'\n'),
    now,pins,nonce:'0'.repeat(32)});
  const ownerApproval=role=>{
    const owner=role==='source'?source:master;
    return signQl365aFirstTrustRequest({request,role,
      localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,now,pins});
  };
  const candidate=assembleQl365aFirstTrust({request,
    sourceApproval:ownerApproval('source'),masterApproval:ownerApproval('master'),now,pins});
  const review=role=>{
    const owner=role==='source'?source:master;
    return signQl365bOwnerReview({candidate,role,
      localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,
      now:now+1000,nonce:role==='source'?'1'.repeat(32):'2'.repeat(32),pins});
  };
  const sourceReview=review('source'),masterReview=review('master');
  const owner=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,
    now:now+3000,pins});
  const keys=Object.fromEntries([...roles,'archive'].map(role=>[role,generateKeyPairSync('ed25519')]));
  const external=Object.fromEntries(roles.map(role=>[role,{
    role,identityId:role==='policy_reviewer'?'external-reviewed-policy-001':'external-reviewed-witness-002',
    spkiSha256:sha(keys[role].publicKey.export({format:'der',type:'spki'})),
    issuerAnchorSha256:role==='policy_reviewer'?'a'.repeat(64):'b'.repeat(64),
    publicKeyPem:keys[role].publicKey.export({format:'pem',type:'spki'}),
    independentlyAuthenticated:true,revoked:false}]));
  const proof=role=>{
    const identity=external[role];
    const payload={schema:QL365C_PROOF,role,identityId:identity.identityId,
      spkiSha256:identity.spkiSha256,
      audience:'rosevear-comms-hub:ql365c:private-offline:TEST',
      scope:'provisional-original-reviewer-identity-only',
      candidateSha256:owner.candidateSha256,
      sourceReviewSha256:owner.sourceReviewSha256,
      masterReviewSha256:owner.masterReviewSha256,
      liveEnrollmentAuthorized:false,issuedAt:new Date(now+2000).toISOString(),
      expiresAt:new Date(now+300_000).toISOString(),
      nonce:role===roles[0]?'3'.repeat(32):'4'.repeat(32)};
    return {schema:QL365C_PROOF,payload,
      signature:makeSig(payload,keys[role].privateKey)};
  };
  const proofs={policy_reviewer:proof(roles[0]),field_witness:proof(roles[1])};
  const resolveIndependentIdentity=async role=>external[role];
  const verifyIdentityCustody=async ({role,identityId,spkiSha256,issuerAnchorSha256,
    candidateSha256})=>({role,identityId,spkiSha256,issuerAnchorSha256,candidateSha256,
    authenticated:true,verified:true,revoked:false});
  const input={candidate,sourceReview,masterReview,proofs,
    resolveIndependentIdentity,verifyIdentityCustody,now:now+3000,pins};
  const decision=role=>{
    const payload={schema:QL365B_DECISION_SCHEMA,role,
      audience:'rosevear-comms-hub:ql365b:offline-first-trust:TEST',
      scope:'independent-review-for-supervised-preflight-only',
      decision:'ACCEPT_FOR_OFFLINE_PREFLIGHT_REVIEW_ONLY',
      candidateSha256:owner.candidateSha256,
      sourceReviewSha256:owner.sourceReviewSha256,
      masterReviewSha256:owner.masterReviewSha256,
      databaseEnrollmentAuthorized:false,receiverActivationAuthorized:false,
      issuedAt:new Date(now+3500).toISOString(),
      expiresAt:new Date(now+300_000).toISOString(),
      nonce:role===roles[0]?'5'.repeat(32):'6'.repeat(32)};
    return {schema:QL365B_DECISION_SCHEMA,payload,
      signature:makeSig(payload,keys[role].privateKey)};
  };
  const policyDecision=decision(roles[0]),fieldWitnessDecision=decision(roles[1]);
  const archiveSigner={spkiSha256:sha(keys.archive.publicKey.export({format:'der',type:'spki'})),
    publicKeyPem:keys.archive.publicKey.export({format:'pem',type:'spki'})};
  const verifiedRegistry=async()=>prepareQl365cReviewerEnrollment(input);
  const makeCustody=registry=>{
    const payload={schema:QL365C_CUSTODY,
      audience:'rosevear-comms-hub:ql365c:offline-custody:TEST',
      scope:'append-only-review-evidence-no-private-test-permit',
      registrySha256:sha(canonicalize(registry)),candidateSha256:owner.candidateSha256,
      policyDecisionSha256:sha(canonicalize(policyDecision)),
      fieldWitnessDecisionSha256:sha(canonicalize(fieldWitnessDecision)),
      decision:'FILE_VERIFIED_OFFLINE_DECISIONS_ONLY',
      databaseEnrollmentAuthorized:false,receiverActivationAuthorized:false,
      issuedAt:new Date(now+4000).toISOString(),
      expiresAt:new Date(now+240_000).toISOString(),nonce:'7'.repeat(32)};
    return {schema:QL365C_CUSTODY,payload,
      signature:makeSig(payload,keys.archive.privateKey)};
  };
  const custodyArgs=async()=>{
    const r=await verifiedRegistry(),registry=r.registry,custodyReceipt=makeCustody(registry);
    return {...input,now:now+5000,registry,policyDecision,fieldWitnessDecision,
      custodyReceipt,resolveArchiveSigner:async()=>archiveSigner,
      verifyArchiveSignerCustody:async ({spkiSha256,registrySha256})=>({
        authenticated:true,revoked:false,spkiSha256,registrySha256}),
      readOriginalCustody:async()=>({bytes:Buffer.from(canonicalize(custodyReceipt)),
        originalPrivateStoreVerified:true,readAt:new Date(now+5000).toISOString()})};
  };
  const preflightReads={
    readOriginalReceiver:async()=>({state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
      computer:'DESKTOP-AE894KC',port:8788,listenerCount:0,
      tailnetServeNoConfig:true,receiverActivated:false,originalActiveStopWitness:false,
      observedAt:new Date(now+5000).toISOString()}),
    readOriginalDatabase:async()=>({state:'ORIGINAL_PRIVATE_DATABASE_READ_ONLY',
      receiverRole:'NOLOGIN',enrollmentCount:0,signedReceiptCount:0,
      observedAt:new Date(now+5000).toISOString()}),
    readSixOriginalPeers:async()=>({state:'SIX_HELD_PEERS',held:6,connected:0,grants:0,
      observedAt:new Date(now+5000).toISOString()}),
    verifyBothOriginalOwners:async()=>({state:'TWO_INDEPENDENT_ORIGINAL_OWNER_SESSIONS',
      sourceHost:'DESKTOP-AE894KC',masterHost:'TEMPLAR',sourceAuthenticated:true,
      masterAuthenticated:true,observedAt:new Date(now+5000).toISOString()})};
  return {candidate,sourceReview,masterReview,owner,pins,keys,external,proofs,
    verifiedRegistry,input,custodyArgs,preflightReads,policyDecision,fieldWitnessDecision};
}

test('QL-365C refuses default synthetic identities and missing independent resolvers',async()=>{
  const f=fixture();
  assert.notEqual(f.pins.source.spkiSha256,QL365A_PINS.source.spkiSha256);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,pins:QL365A_PINS})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    resolveIndependentIdentity:null})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    verifyIdentityCustody:null})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    proofs:{policy_reviewer:f.proofs.policy_reviewer}})).valid,false);
});

test('distinct verified external identities form only a PROVISIONAL offline registry',async()=>{
  const f=fixture(),r=await f.verifiedRegistry();
  assert.equal(r.valid,true);
  assert.equal(r.originalOwnerReviewsVerified,true);
  assert.equal(r.registry.reviewerIdentitiesEnrolled,false);
  assert.equal(r.registry.receiverActivated,false);
  assert.equal(r.registry.connected,false);
  assert.equal(r.registry.liveTrustAuthorized,false);
  assert.equal(r.reviewerIdentitiesEnrolled,false);
});

test('self-pinned, revoked, reused, forged and expired reviewer identities deny',async()=>{
  const f=fixture(),valid=await f.verifiedRegistry();
  assert.equal(valid.valid,true);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    verifyIdentityCustody:async params=>({...params,authenticated:true,verified:true,
      revoked:true})})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    resolveIndependentIdentity:async role=>({...f.external[role],
      spkiSha256:f.pins.source.spkiSha256})})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    resolveIndependentIdentity:async role=>({...f.external[role],
      issuerAnchorSha256:f.pins.master.spkiSha256})})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    resolveIndependentIdentity:async()=>f.external.policy_reviewer})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    proofs:{...f.proofs,policy_reviewer:{...f.proofs.policy_reviewer,
      signature:f.proofs.field_witness.signature}}})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    now:now+1_200_001})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    registeredAt:new Date(now+1000).toISOString()})).valid,false);
  assert.equal((await prepareQl365cReviewerEnrollment({...f.input,
    proofs:{...f.proofs,policy_reviewer:{...f.proofs.policy_reviewer,
      payload:{...f.proofs.policy_reviewer.payload,liveEnrollmentAuthorized:true}}}})).valid,false);
});

test('provisional enrollment requires immutable append and exact original-byte readback',async()=>{
  const f=fixture(),r=await f.verifiedRegistry();
  assert.equal((await recordQl365cProvisionalEnrollment(f.input)).valid,false);
  const appendOriginalRegistry=async ({idempotencyKey,bytes,mode})=>({
    committed:true,sha256:sha(bytes),immutable:true,active:false,
    checkedKey:idempotencyKey,checkedMode:mode});
  const readOriginalRegistry=async()=>({bytes:Buffer.from(canonicalize(r.registry)),
    originalPrivateStoreVerified:true});
  const success=await recordQl365cProvisionalEnrollment({...f.input,
    appendOriginalRegistry,readOriginalRegistry});
  assert.equal(success.valid,true);
  assert.equal(success.reviewerIdentitiesEnrolled,false);
  assert.equal(success.receiverActivated,false);
  assert.equal((await recordQl365cProvisionalEnrollment({...f.input,
    appendOriginalRegistry,readOriginalRegistry:async()=>({bytes:Buffer.from('spoof'),
      originalPrivateStoreVerified:true})})).valid,false);
});

test('independent archive signature and original immutable bytes verify without TEST permit',async()=>{
  const f=fixture(),args=await f.custodyArgs();
  const r=await verifyQl365cDecisionCustody(args);
  assert.equal(r.valid,true);
  assert.equal(r.decisionCustodyVerified,true);
  assert.equal(r.independentPolicyReviewerVerified,true);
  assert.equal(r.independentFieldWitnessVerified,true);
  for(const field of ['privateTestAuthorized','databaseEnrollmentAuthorized',
    'receiverActivated','sixAppGrantsAuthorized','connected',
    'reviewerIdentitiesEnrolled'])assert.equal(r[field],false);
});

test('forged custody, swapped archive key, changed registry and missing readback fail',async()=>{
  const f=fixture(),a=await f.custodyArgs();
  const check=change=>verifyQl365cDecisionCustody({...a,...change});
  assert.equal((await check({registry:{...a.registry,liveTrustAuthorized:true}})).valid,false);
  assert.equal((await check({custodyReceipt:{...a.custodyReceipt,
    signature:f.policyDecision.signature}})).valid,false);
  assert.equal((await check({resolveArchiveSigner:async()=>f.external.policy_reviewer})).valid,false);
  assert.equal((await check({readOriginalCustody:async()=>({
    bytes:Buffer.from('tampered'),originalPrivateStoreVerified:true,
    readAt:new Date(now+5000).toISOString()})})).valid,false);
  assert.equal((await check({readOriginalCustody:null})).valid,false);
  assert.equal((await check({policyDecision:{...a.policyDecision,
    payload:{...a.policyDecision.payload,receiverActivationAuthorized:true}}})).valid,false);
  const earlyDecision={...a.policyDecision.payload,
    issuedAt:new Date(now+2800).toISOString()};
  assert.equal((await check({policyDecision:{schema:QL365B_DECISION_SCHEMA,
    payload:earlyDecision,
    signature:makeSig(earlyDecision,f.keys.policy_reviewer.privateKey)}})).valid,false);
  let policyIdentityReads=0;
  assert.equal((await check({resolveIndependentIdentity:async role=>{
    if(role!=='policy_reviewer')return f.external[role];
    policyIdentityReads++;
    return policyIdentityReads===1?f.external[role]:
      {...f.external[role],identityId:'changed-independently-asserted-reviewer'};
  }})).valid,false);
});

test('fresh four original readbacks yield supervised preflight checklist, never authorization',async()=>{
  const f=fixture(),a=await f.custodyArgs();
  const r=await assessQl365cSupervisedTestPreflight({...a,...f.preflightReads});
  assert.equal(r.valid,true);
  assert.equal(r.originalReceiverOffVerified,true);
  assert.equal(r.originalDatabaseNoLoginVerified,true);
  assert.equal(r.allSixPeersHeldVerified,true);
  assert.equal(r.ownerPresenceVerified,true);
  for(const field of ['privateTestAuthorized','databaseEnrollmentAuthorized',
    'receiverActivated','sixAppGrantsAuthorized','connected'])assert.equal(r[field],false);
  const failed=await assessQl365cSupervisedTestPreflight({...a,...f.preflightReads,
    readOriginalDatabase:async()=>({state:'ORIGINAL_PRIVATE_DATABASE_READ_ONLY',
      receiverRole:'LOGIN',enrollmentCount:1,signedReceiptCount:0,
      observedAt:new Date(now+5000).toISOString()})});
  assert.equal(failed.valid,false);
});

test('stale receiver or incomplete independent owner readback must remain held',async()=>{
  const f=fixture(),a=await f.custodyArgs();
  assert.equal((await assessQl365cSupervisedTestPreflight({...a,
    ...f.preflightReads,readOriginalReceiver:async()=>({
      state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',computer:'DESKTOP-AE894KC',
      port:8788,listenerCount:0,tailnetServeNoConfig:true,
      receiverActivated:false,originalActiveStopWitness:false,
      observedAt:new Date(now-60_000).toISOString()})})).valid,false);
  assert.equal((await assessQl365cSupervisedTestPreflight({...a,
    ...f.preflightReads,verifyBothOriginalOwners:async()=>({
      state:'TWO_INDEPENDENT_ORIGINAL_OWNER_SESSIONS',sourceHost:'DESKTOP-AE894KC',
      masterHost:'TEMPLAR',sourceAuthenticated:true,masterAuthenticated:false,
      observedAt:new Date(now+5000).toISOString()})})).valid,false);
});

test('nonoriginal Windows CI has status only and cannot inspect original owner evidence',async()=>{
  const status=await ql365cCli(['--status']);
  assert.equal(status.receiverActivated,false);
  assert.equal(status.privateTestAuthorized,false);
  assert.equal(status.connected,false);
  if(process.platform!=='win32')
    await assert.rejects(ql365cCli(['--inspect-owner-reviews','a','b','c']),
      /DENY_QL365C_NONORIGINAL_WINDOWS_OWNER/);
  assert.equal((await ql365cCli(['--help'])).databaseEnrollmentAuthorized,false);
});
