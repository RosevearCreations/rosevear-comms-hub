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
  assembleQl365aFirstTrust} from './ql365a-first-time-trust.mjs';
import {QL365B_REVIEW_SCHEMA,QL365B_DECISION_SCHEMA,signQl365bOwnerReview,
  verifyQl365bOwnerReviews,verifyQl365bIndependentDecisions}
  from './ql365b-original-reconciliation.mjs';
import {ql365bCli} from './ql365b-original-review-cli.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const now=Date.parse('2026-11-07T18:00:00.000Z');
const phrase='synthetic-QL365B-test-passphrase';
const roles=['policy_reviewer','field_witness'];

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'ql365b-synthetic-'));
  const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',passphrase:phrase});
  const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',passphrase:phrase});
  const sourceBytes=Buffer.from(JSON.stringify(source.publicCandidate,null,2)+'\n');
  const masterBytes=Buffer.from(JSON.stringify(master.publicCandidate,null,2)+'\n');
  const pins={source:{keyId:source.publicCandidate.keyId,
    spkiSha256:source.publicCandidate.spkiSha256,originalFileSha256:sha(sourceBytes)},
  master:{keyId:master.publicCandidate.keyId,
    spkiSha256:master.publicCandidate.spkiSha256,originalFileSha256:sha(masterBytes)}};
  const deviceKey=generateKeyPairSync('ed25519');
  const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
    deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
    devicePublicKeyPem:deviceKey.publicKey.export({format:'pem',type:'spki'}),
    deviceSpkiSha256:sha(deviceKey.publicKey.export({format:'der',type:'spki'})),
    enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
  const evidencePaths={};
  for(const [index,role] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    const file=join(dir,role+'.json');
    writeFileSync(file,JSON.stringify({schema:'SYNTHETIC_ONLY',role,
      body:'x'.repeat(70+index)}));
    evidencePaths[role]=file;
  }
  const off={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(now-10_000).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,evidenceDigests:hashWitnessFiles(evidencePaths),
    receiverOffObserved:true,originalReceiverStopped:false,
    originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
    connected:false,customerCommunications:false,deviceActions:false};
  const offBytes=Buffer.from(JSON.stringify(off,null,2)+'\n');
  const request=createQl365aFirstTrustRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,sourceOriginalBytes:sourceBytes,
    evidencePaths,offObservation:off,offObservationBytes:offBytes,
    now,pins,nonce:'0123456789abcdef0123456789abcdef'});
  const approval=(role)=>{
    const owner=role==='source'?source:master;
    return signQl365aFirstTrustRequest({request,role,localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase:phrase,now,pins});
  };
  const candidate=assembleQl365aFirstTrust({request,
    sourceApproval:approval('source'),masterApproval:approval('master'),now,pins});
  const review=(role,at=now+1000)=>{
    const owner=role==='source'?source:master;
    return signQl365bOwnerReview({candidate,role,localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase:phrase,
      now:at,pins,nonce:role==='source'?'1'.repeat(32):'2'.repeat(32)});
  };
  const sourceReview=review('source'),masterReview=review('master');
  const external=Object.fromEntries(roles.map(role=>[role,generateKeyPairSync('ed25519')]));
  const reviewers=Object.fromEntries(roles.map(role=>[role,{role,
    spkiSha256:sha(external[role].publicKey.export({type:'spki',format:'der'})),
    publicKeyPem:external[role].publicKey.export({type:'spki',format:'pem'})}]));
  const original=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now:now+3000,pins});
  const decision=(role,changes={})=>{
    const payload={schema:QL365B_DECISION_SCHEMA,role,
      audience:'rosevear-comms-hub:ql365b:offline-first-trust:TEST',
      scope:'independent-review-for-supervised-preflight-only',
      decision:'ACCEPT_FOR_OFFLINE_PREFLIGHT_REVIEW_ONLY',
      candidateSha256:original.candidateSha256,
      sourceReviewSha256:original.sourceReviewSha256,
      masterReviewSha256:original.masterReviewSha256,
      databaseEnrollmentAuthorized:false,receiverActivationAuthorized:false,
      issuedAt:new Date(now+2000).toISOString(),
      expiresAt:new Date(now+300_000).toISOString(),nonce:role===roles[0]?'3'.repeat(32):'4'.repeat(32),
      ...changes};
    return {schema:QL365B_DECISION_SCHEMA,payload,
      signature:sign(null,Buffer.from(canonicalize(payload)),external[role].privateKey)
        .toString('base64url')};
  };
  const trust=({policyDecision=decision(roles[0]),fieldWitnessDecision=decision(roles[1]),
    resolvePinnedReviewer=async role=>reviewers[role],
    verifyIndependentCustody=async ({role,spkiSha256,candidateSha256})=>({
      role,spkiSha256,candidateSha256,authenticated:true,revoked:false}),
    ...changes}={})=>verifyQl365bIndependentDecisions({candidate,sourceReview,masterReview,
      policyDecision,fieldWitnessDecision,resolvePinnedReviewer,
      verifyIndependentCustody,now:now+3000,pins,...changes});
  return {request,candidate,source,master,sourceBytes,masterBytes,sourceReview,
    masterReview,pins,review,original,decision,trust,reviewers,external};
}

test('two original keys add distinct scoped offline review signatures after QL-365A',()=>{
  const f=fixture(),r=f.original;
  assert.equal(f.sourceReview.schema,QL365B_REVIEW_SCHEMA);
  assert.notEqual(f.sourceReview.signature,f.masterReview.signature);
  assert.equal(r.valid,true);
  assert.equal(r.originalOwnerReviewsVerified,true);
  assert.equal(r.state,'ORIGINAL_OWNER_REVIEW_SIGNATURES_VALID_EXTERNAL_TRUST_STILL_HELD');
  assert.equal(r.receiverActivated,false);
  assert.equal(r.databaseEnrollmentAuthorized,false);
  assert.equal(r.supervisedTestAuthorized,false);
  assert.equal(r.connected,false);
  assert.throws(()=>f.review('master',now+1_200_010),/HOLD_QL365A_EXPIRED/);
});

test('review rejects one owner, swapped roles, tamper, changed keys and replay',()=>{
  const f=fixture();
  const check=(sourceReview,masterReview,candidate=f.candidate)=>
    verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now:now+3000,pins:f.pins});
  assert.equal(check(f.sourceReview,null).valid,false);
  assert.equal(check(f.masterReview,f.sourceReview).valid,false);
  assert.equal(check({...f.sourceReview,payload:{...f.sourceReview.payload,
    receiverActivationAuthorized:true}},f.masterReview).valid,false);
  assert.equal(check({...f.sourceReview,signature:f.masterReview.signature},f.masterReview).valid,false);
  assert.equal(check(f.sourceReview,f.masterReview,{...f.candidate,
    decision:'UNTRUSTED_REWRITTEN'}).valid,false);
  assert.equal(verifyQl365bOwnerReviews({candidate:f.candidate,
    sourceReview:f.sourceReview,masterReview:f.masterReview,
    now:now+1_200_001,pins:f.pins}).valid,false);
  assert.throws(()=>signQl365bOwnerReview({candidate:f.candidate,role:'source',
    localCandidate:f.source.publicCandidate,originalPublicBytes:Buffer.from('changed'),
    encryptedPrivateKeyPem:f.source.encryptedPrivateKeyPem,
    passphrase:phrase,now:now+1000,pins:f.pins}),/DENY_QL365B_LOCAL_OWNER/);
});

test('real independent pins plus custody and signatures allow OFFLINE preflight only',async()=>{
  const f=fixture(),r=await f.trust();
  assert.equal(r.valid,true);
  assert.equal(r.independentPolicyDecisionVerified,true);
  assert.equal(r.independentFieldWitnessVerified,true);
  assert.equal(r.state,'SUPERVISED_OFFLINE_TEST_PREFLIGHT_REVIEW_ELIGIBLE_NO_ACTIVATION');
  for(const field of ['legacyQl355Satisfied','originalIssuerAuthenticated',
    'receiverActivated','databaseEnrollmentAuthorized','supervisedTestAuthorized',
    'sixAppGrantsAuthorized','connected'])assert.equal(r[field],false);
});

test('missing independent pins/custody, revoked signer and owner-key reuse fail closed',async()=>{
  const f=fixture();
  // A missing independent verifier cannot be replaced by a file-supplied PEM.
  assert.equal((await f.trust({resolvePinnedReviewer:null})).valid,false);
  assert.equal((await f.trust({verifyIndependentCustody:null})).valid,false);
  assert.equal((await f.trust({verifyIndependentCustody:async ({role,spkiSha256,candidateSha256})=>({
    role,spkiSha256,candidateSha256,authenticated:true,revoked:true})})).valid,false);
  assert.equal((await f.trust({resolvePinnedReviewer:async role=>role==='policy_reviewer'?
    {...f.reviewers.policy_reviewer,spkiSha256:f.pins.source.spkiSha256}:
    f.reviewers[role]})).valid,false);
  assert.equal((await f.trust({resolvePinnedReviewer:async role=>({
    ...f.reviewers[role],spkiSha256:f.reviewers.policy_reviewer.spkiSha256,
    publicKeyPem:f.reviewers.policy_reviewer.publicKeyPem})})).valid,false);
});

test('false external decisions, forged signatures, cross-candidate and expiry deny',async()=>{
  const f=fixture();
  assert.equal((await f.trust({policyDecision:f.decision('policy_reviewer',
    {decision:'REJECT'})})).valid,false);
  assert.equal((await f.trust({policyDecision:f.decision('policy_reviewer',
    {receiverActivationAuthorized:true})})).valid,false);
  assert.equal((await f.trust({policyDecision:{...f.decision('policy_reviewer'),
    signature:f.decision('field_witness').signature}})).valid,false);
  assert.equal((await f.trust({fieldWitnessDecision:f.decision('field_witness',
    {candidateSha256:'9'.repeat(64)})})).valid,false);
  assert.equal((await f.trust({policyDecision:f.decision('policy_reviewer',
    {expiresAt:new Date(now-5000).toISOString()})})).valid,false);
  assert.equal((await f.trust({policyDecision:f.decision('policy_reviewer',
    {expiresAt:new Date(now+1_250_000).toISOString()})})).valid,false);
  assert.equal((await f.trust({sourceReview:{...f.sourceReview,
    signature:'a'.repeat(86)}})).valid,false);
});

test('CI/nonoriginal machine can only run inert --status and --help',async()=>{
  const status=await ql365bCli(['--status']);
  assert.equal(status.connected,false);
  assert.equal(status.supervisedTestAuthorized,false);
  assert.equal(status.databaseEnrollmentAuthorized,false);
  if(process.platform!=='win32'){
    for(const args of [['--inspect','file'],['--review','a','b','c'],
      ['--reconcile','a','b','c']])
      await assert.rejects(ql365bCli(args),/DENY_QL365B_NONORIGINAL_WINDOWS_OWNER/);
  }
  assert.equal((await ql365bCli(['--help'])).receiverActivated,false);
});
