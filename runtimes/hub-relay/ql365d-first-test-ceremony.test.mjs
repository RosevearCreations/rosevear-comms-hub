import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize,SOURCES} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {hashWitnessFiles} from './ql340b-enrollment.mjs';
import {createQl365aFirstTrustRequest,signQl365aFirstTrustRequest,
  assembleQl365aFirstTrust,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {signQl365bOwnerReview} from './ql365b-original-reconciliation.mjs';
import {QL365C_CUSTODY} from './ql365c-reviewer-custody.mjs';
import {QL365D_REQUEST,QL365D_SIGNED,createQl365dFirstTestRequest,
  inspectQl365dFirstTestRequest,signQl365dOwnerReview,
  verifyQl365dDualOwnerReview,assembleQl365dSignedReview,
  inspectQl365dSignedReview,assessQl365dOwnerGovernedFirstTestReview}
  from './ql365d-first-test-ceremony.mjs';
import {ql365dCli} from './ql365d-original-test-cli.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const now=Date.parse('2026-11-07T20:00:00.000Z');
const passphrase='QL365D-synthetic-private-test-passphrase';

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'ql365d-synthetic-'));
  const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',passphrase});
  const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',passphrase});
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
  for(const [i,role] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    const path=join(dir,role+'.json');
    writeFileSync(path,JSON.stringify({schema:'SYNTHETIC_ONLY',role,body:'x'.repeat(70+i)}));
    evidencePaths[role]=path;
  }
  const off={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(now-5000).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,evidenceDigests:hashWitnessFiles(evidencePaths),
    receiverOffObserved:true,originalReceiverStopped:false,
    originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
    connected:false,customerCommunications:false,deviceActions:false};
  const req=createQl365aFirstTrustRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,sourceOriginalBytes:sourceBytes,evidencePaths,
    offObservation:off,offObservationBytes:Buffer.from(JSON.stringify(off,null,2)+'\n'),
    now,pins,nonce:'0'.repeat(32)});
  const approval=role=>{
    const owner=role==='source'?source:master;
    return signQl365aFirstTrustRequest({request:req,role,
      localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,now,pins});
  };
  const candidate=assembleQl365aFirstTrust({request:req,
    sourceApproval:approval('source'),masterApproval:approval('master'),now,pins});
  const review=role=>{
    const owner=role==='source'?source:master;
    return signQl365bOwnerReview({candidate,role,
      localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,
      now:now+1000,nonce:role==='source'?'1'.repeat(32):'2'.repeat(32),pins});
  };
  const sourceReview=review('source'),masterReview=review('master');
  // A mere syntactically signed custody JSON is NOT independently authenticated.
  const custodyReceipt={schema:QL365C_CUSTODY,payload:{schema:QL365C_CUSTODY,
    scope:'append-only-review-evidence-no-private-test-permit',
    decision:'FILE_VERIFIED_OFFLINE_DECISIONS_ONLY',
    receiverActivationAuthorized:false,databaseEnrollmentAuthorized:false},
    signature:'A'.repeat(86)};
  const create=(sourceId='yw',changes={})=>createQl365dFirstTestRequest({
    sourceId,candidate,sourceReview,masterReview,custodyReceipt,
    now:now+2000,nonce:'3'.repeat(32),
    operationId:'d84b917e-671e-48b2-a5dd-673b4645a80a',pins,...changes});
  const request=create();
  const signRole=(role,requestForSign=request)=>{
    const owner=role==='source'?source:master;
    return signQl365dOwnerReview({request:requestForSign,candidate,sourceReview,
      masterReview,custodyReceipt,role,localCandidate:owner.publicCandidate,
      originalPublicBytes:role==='source'?sourceBytes:masterBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,
      now:now+3000,pins});
  };
  const sourceApproval=signRole('source'),masterApproval=signRole('master');
  const verify=(changes={})=>verifyQl365dDualOwnerReview({request,candidate,
    sourceReview,masterReview,custodyReceipt,sourceApproval,masterApproval,
    now:now+3000,pins,...changes});
  const signedReview=assembleQl365dSignedReview({request,candidate,
    sourceReview,masterReview,custodyReceipt,sourceApproval,masterApproval,
    now:now+3000,pins});
  return {request,candidate,sourceReview,masterReview,custodyReceipt,pins,
    source,master,sourceBytes,masterBytes,sourceApproval,masterApproval,
    create,signRole,verify,signedReview};
}

test('six exact source shells create only one-source 90-second unsigned TEST review',()=>{
  const f=fixture();
  for(const [id,source] of Object.entries(SOURCES)){
    const request=f.create(id,{operationId:
      'd84b917e-671e-48b2-a5dd-673b4645a80a'});
    assert.equal(request.schema,QL365D_REQUEST);
    assert.equal(request.payload.sourceId,id);
    assert.equal(request.payload.repository,`RosevearCreations/${source.repo}`);
    assert.equal(request.payload.tenantBoundary,source.boundary);
    assert.equal(request.payload.method,'GET');
    assert.equal(request.payload.path,'/api/integration/v1/shell/health');
    assert.equal(request.payload.maxResponseBytes,4096);
    assert.equal(request.payload.automaticRetry,false);
    assert.equal(request.payload.receiverActivated,false);
    assert.equal(request.payload.externalCustodyIndependentlyVerified,false);
  }
  assert.equal((new Date(f.request.payload.expiresAt)-new Date(f.request.payload.issuedAt)),90_000);
  assert.throws(()=>f.create('unknown-source'),/DENY_QL365D_ONE_SOURCE/);
});

test('separate original Ed25519 owner signatures reconcile only an offline review',()=>{
  const f=fixture(),r=f.verify();
  assert.equal(r.valid,true);
  assert.equal(r.dualOriginalOwnerSignaturesVerified,true);
  assert.equal(r.state,'TWO_ORIGINAL_OWNERS_SIGNED_ONE_SOURCE_REVIEW_NO_TEST_PERMISSION');
  assert.equal(f.signedReview.schema,QL365D_SIGNED);
  assert.notEqual(f.sourceApproval.signature,f.masterApproval.signature);
  for(const field of ['originalIssuerAuthenticated','independentWitnessAuthenticated',
    'privateTestAuthorized','oneSourceGetAuthorized','receiverActivated',
    'sixAppGrantsAuthorized','connected'])assert.equal(r[field],false);
  assert.equal(inspectQl365dSignedReview({signedReview:f.signedReview,
    candidate:f.candidate,sourceReview:f.sourceReview,
    masterReview:f.masterReview,custodyReceipt:f.custodyReceipt,
    now:now+3000,pins:f.pins}).valid,true);
});

test('one owner, role swap, forged signature or changed source denies',()=>{
  const f=fixture();
  assert.equal(f.verify({masterApproval:null}).valid,false);
  assert.equal(f.verify({sourceApproval:f.masterApproval,
    masterApproval:f.sourceApproval}).valid,false);
  assert.equal(f.verify({sourceApproval:{...f.sourceApproval,
    signature:f.masterApproval.signature}}).valid,false);
  assert.equal(f.verify({request:{...f.request,payload:{...f.request.payload,
    sourceId:'icamp'}}}).valid,false);
  assert.equal(f.verify({request:{...f.request,payload:{...f.request.payload,
    receiverActivated:true}}}).valid,false);
  assert.equal(f.verify({request:{...f.request,payload:{...f.request.payload,
    customerCommunications:true}}}).valid,false);
  assert.equal(f.verify({request:{...f.request,payload:{...f.request.payload,
    maxResponseBytes:1_000_000}}}).valid,false);
});

test('changed QL-365C custody hash, replay and expiration fail closed',()=>{
  const f=fixture();
  assert.equal(f.verify({custodyReceipt:{...f.custodyReceipt,
    signature:'B'.repeat(86)}}).valid,false);
  assert.equal(f.verify({now:now+92_001}).valid,false);
  assert.equal(f.verify({request:{...f.request,payload:{...f.request.payload,
    nonce:'f'.repeat(32)}}}).valid,false);
  assert.throws(()=>f.create('yw',{now:now+1_150_000}),
    /DENY_QL365D_ONE_SOURCE/);
});

test('real production pins cannot be replaced by synthetic owner proofs',()=>{
  const f=fixture();
  assert.equal(inspectQl365dFirstTestRequest({request:f.request,
    candidate:f.candidate,sourceReview:f.sourceReview,
    masterReview:f.masterReview,custodyReceipt:f.custodyReceipt,
    now:now+3000,pins:QL365A_PINS}).valid,false);
  assert.throws(()=>signQl365dOwnerReview({request:f.request,
    candidate:f.candidate,sourceReview:f.sourceReview,
    masterReview:f.masterReview,custodyReceipt:f.custodyReceipt,
    role:'source',localCandidate:f.source.publicCandidate,
    originalPublicBytes:Buffer.from('altered original file'),
    encryptedPrivateKeyPem:f.source.encryptedPrivateKeyPem,
    passphrase,now:now+3000,pins:f.pins}),/DENY_QL365D_LOCAL_ORIGINAL_PIN/);
});

test('unsigned or syntactically signed custody never authorizes private TEST',async()=>{
  const f=fixture();
  const r=await assessQl365dOwnerGovernedFirstTestReview({
    signedReview:f.signedReview,candidate:f.candidate,
    sourceReview:f.sourceReview,masterReview:f.masterReview,
    custodyReceipt:f.custodyReceipt,now:now+3000,pins:f.pins,
    ql365cArgs:{candidate:f.candidate,sourceReview:f.sourceReview,
      masterReview:f.masterReview,custodyReceipt:f.custodyReceipt},
    sourceRecord:{sourceId:'yw'},peer:{peerId:'yw',repository:'yw'}});
  assert.equal(r.valid,false);
  assert.equal(r.privateTestAuthorized,false);
  assert.equal(r.oneSourceGetAuthorized,false);
  assert.equal(r.connected,false);
});

test('nonoriginal Windows/CI cannot prepare, sign, assemble, or initiate private TEST',async()=>{
  const status=await ql365dCli(['--status']);
  assert.equal(status.receiverActivated,false);
  assert.equal(status.privateTestAuthorized,false);
  assert.equal(status.connected,false);
  if(process.platform!=='win32'){
    for(const args of [['--prepare','yw','a','b','c','d','e'],
      ['--inspect','a','b','c','d','e'],
      ['--sign','a','b','c','d','e','f','g'],
      ['--assemble','a','b','c','d','e','f','g','h']])
      await assert.rejects(ql365dCli(args),/DENY_QL365D_NONORIGINAL_WINDOWS_OWNER/);
  }
  assert.equal((await ql365dCli(['--help'])).databaseEnrollmentAuthorized,false);
});

test('six-app handoff contains all exact source IDs, repository names and handler paths',()=>{
  const doc=readFileSync(fileURLToPath(new URL('../../docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md',import.meta.url)),'utf8');
  const paths={
    yw:'server/ql364-source-health.mjs',
    icamp:'lib/integration-v1/ql364-source-health.mjs',
    rosiedazzlers:'functions/api/_lib/ql364-source-health.mjs',
    devilndove:'functions/api/_lib/ql364-source-health.mjs',
    'ai-data-platform':'apps/web/lib/ql364-source-health.mjs',
    'rosevear-ai-hub':'server/src/rosevear_ai_hub/api/ql364_source_health.py'
  };
  assert.deepEqual(Object.keys(paths).sort(),Object.keys(SOURCES).sort());
  for(const [id,source] of Object.entries(SOURCES)){
    assert.ok(doc.includes(`| \`${id}\` | \`RosevearCreations/${source.repo}\` | \`${paths[id]}\` |`),
      `Missing source handoff for ${id}`);
  }
  assert.match(doc,/DISCONNECTED \/ HOLD/);
  assert.match(doc,/independent.*(?:issuer|custody)|issuer.*witness/i);
});

test('previous owner field validation is reused without inventing signed authorization or asking for reruns',()=>{
  const doc=readFileSync(fileURLToPath(new URL('../../docs/handoffs/QL365D_PRIOR_FIELD_VALIDATION_RECONCILIATION.md',import.meta.url)),'utf8');
  const handoff=readFileSync(fileURLToPath(new URL('../../docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md',import.meta.url)),'utf8');
  for(const role of ['source','master']){
    assert.ok(doc.includes(QL365A_PINS[role].keyId));
    assert.ok(doc.includes(QL365A_PINS[role].spkiSha256));
    assert.ok(doc.includes(QL365A_PINS[role].originalFileSha256));
  }
  assert.match(handoff,/Do not ask\s+either owner to repeat QL-359\/356/);
  assert.match(doc,/private TEST receipt/);
  assert.match(doc,/DISCONNECTED \/ HOLD/);
  assert.match(doc,/do not ask.*to repeat|Do not tell Ree or Jack to rerun/i);
});
