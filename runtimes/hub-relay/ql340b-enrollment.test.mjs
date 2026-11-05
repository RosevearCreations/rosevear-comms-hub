import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {existsSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {assembleSignedEnrollment,createEnrollmentRequest,hashWitnessFiles,
  inspectEnrollmentRequest,signOwnerRequest,verifiedCandidatePins} from './ql340b-enrollment.mjs';
import {runCeremonyCli} from './ql340b-ceremony.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const authority=(role,secret)=>createOwnerAuthorityCandidate({role,
  keyId:`synthetic-${role}-only`,passphrase:secret});
const source=authority('source','not-a-real-source-passphrase');
const master=authority('master','not-a-real-master-passphrase');
const deviceKeys=generateKeyPairSync('ed25519');
const deviceDer=deviceKeys.publicKey.export({format:'der',type:'spki'});
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'synthetic-windows-hub',workloadId:'hub-probe',keyId:'synthetic-hub-key',
  devicePublicKeyPem:deviceKeys.publicKey.export({format:'pem',type:'spki'}),
  deviceSpkiSha256:hash(deviceDer),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:source.publicCandidate,master:master.publicCandidate};
const witnessHashes={windowsWitnessSha256:hash('synthetic-windows'),
  privateTlsWitnessSha256:hash('synthetic-tls'),tailnetAclWitnessSha256:hash('synthetic-acl'),
  rollbackWitnessSha256:hash('synthetic-rollback')};
const now=Date.parse('2026-11-05T20:00:00.000Z');
const request=()=>createEnrollmentRequest({...candidates,witnessHashes,now});

test('synthetic two-owner TEST enrollment signs the exact same reviewed payload offline',()=>{
  const r=request(),inspected=inspectEnrollmentRequest(r,now);
  assert.equal(inspected.valid,true);
  const s=signOwnerRequest({request:r,role:'source',localCandidate:source.publicCandidate,
    encryptedPrivateKeyPem:source.encryptedPrivateKeyPem,passphrase:'not-a-real-source-passphrase',now});
  const m=signOwnerRequest({request:r,role:'master',localCandidate:master.publicCandidate,
    encryptedPrivateKeyPem:master.encryptedPrivateKeyPem,passphrase:'not-a-real-master-passphrase',now});
  const assembled=assembleSignedEnrollment({request:r,sourceApproval:s,masterApproval:m,now});
  assert.equal(assembled.state,'SIGNED_TEST_ENROLLMENT_READY_FOR_INDEPENDENT_FIELD_WITNESS');
  assert.equal(assembled.enrollmentRecord.payload.keyId,'synthetic-hub-key');
  assert.equal(assembled.ownerAuthorityPins.master.keyId,'synthetic-master-only');
  assert.equal(assembled.databaseEnrollmentCreated,false);
  assert.equal(assembled.receiverActivated,false);
  assert.equal(assembled.realDeviceReceiptObserved,false);
  assert.throws(()=>assembleSignedEnrollment({request:r,sourceApproval:m,masterApproval:s,now}),
    /DENY_SOURCE_APPROVAL/);
  assert.throws(()=>assembleSignedEnrollment({request:r,sourceApproval:s,masterApproval:m,
    now:now+1_400_000}),/HOLD_ENROLLMENT_EXPIRED_OR_UNBOUNDED/);
  assert.throws(()=>assembleSignedEnrollment({request:{...r,payload:{...r.payload,
    deviceId:'other-windows'}},sourceApproval:s,masterApproval:m,now}),/DENY_SOURCE_APPROVAL|DENY_OWNER_SIGNATURE/);
});

test('wrong owner or passphrase cannot approve; public pins are checked cryptographically',()=>{
  const r=request();
  assert.throws(()=>signOwnerRequest({request:r,role:'master',localCandidate:source.publicCandidate,
    encryptedPrivateKeyPem:source.encryptedPrivateKeyPem,passphrase:'not-a-real-source-passphrase',now}),
    /DENY_SIGNER_NOT_LOCAL_OR_UNPINNED/);
  assert.throws(()=>signOwnerRequest({request:r,role:'source',localCandidate:source.publicCandidate,
    encryptedPrivateKeyPem:source.encryptedPrivateKeyPem,passphrase:'incorrect-owner-passphrase',now}),
    /DENY_OWNER_KEY_DECRYPTION/);
  assert.throws(()=>verifiedCandidatePins({...candidates,
    master:{...master.publicCandidate,spkiSha256:'0'.repeat(64)}}),/DENY_MASTER_PUBLIC_CANDIDATE/);
  assert.throws(()=>verifiedCandidatePins({...candidates,device:{...device,
    deviceSpkiSha256:'0'.repeat(64)}}),/DENY_DEVICE_PUBLIC_CANDIDATE/);
  assert.throws(()=>createEnrollmentRequest({...candidates,
    witnessHashes:{...witnessHashes,rollbackWitnessSha256:witnessHashes.windowsWitnessSha256},now}),
    /HOLD_ORIGINAL_WITNESS_DIGESTS_REQUIRED/);
  assert.equal(inspectEnrollmentRequest({...r,payload:{...r.payload,
    rollbackWitnessSha256:r.payload.windowsWitnessSha256}},now).valid,false);
});

test('witness digest generation requires four distinct, nonempty physical files',()=>{
  const dir=mkdtempSync(join(tmpdir(),'ql340b-test-'));
  const filePaths={};
  for(const [i,key] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    filePaths[key]=join(dir,`${key}.json`);
    writeFileSync(filePaths[key],JSON.stringify({synthetic:true,sequence:i,
      description:'test fixture only; never actual field evidence'}));
  }
  assert.deepEqual(Object.keys(hashWitnessFiles(filePaths)).sort(),Object.keys(witnessHashes).sort());
  assert.throws(()=>hashWitnessFiles({...filePaths,rollback:filePaths.windows}),/DENY_WITNESS_FILES_REUSED/);
});

test('CLI produces only unsigned requests from reviewed local fixture paths; no activation',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'ql340b-cli-test-'));
  const files={};for(const [key,value] of Object.entries(candidates)){
    files[key]=join(dir,`${key}.json`);writeFileSync(files[key],JSON.stringify(value));
  }
  const manifest={};for(const [i,key] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    const path=join(dir,`witness-${key}.txt`);
    writeFileSync(path,`SYNTHETIC TEST ONLY ${key} ${i} evidence for offline tests`);
    manifest[key]=path;
  }
  const manifestPath=join(dir,'manifest.json');writeFileSync(manifestPath,JSON.stringify(manifest));
  const requestPath=join(dir,'unsigned-request.json');
  const result=await runCeremonyCli(['--prepare',files.device,files.source,files.master,
    manifestPath,requestPath]);
  assert.equal(result.databaseEnrollmentCreated,false);
  const reviewed=await runCeremonyCli(['--inspect-request',requestPath]);
  assert.equal(reviewed.valid,true);
  await assert.rejects(()=>runCeremonyCli(['--sign','source',requestPath,
    '0'.repeat(64),join(dir,'bad-approval.json')]),/DENY_OWNER_REVIEW_HASH_MISMATCH/);
  assert.equal(readFileSync(requestPath,'utf8').includes('PRIVATE KEY'),false);
  await assert.rejects(()=>runCeremonyCli(['--prepare',files.device,files.source,files.master,
    manifestPath,requestPath]),/EEXIST/);
  await assert.rejects(()=>runCeremonyCli(['--activate']),/DENY_UNAPPROVED_CEREMONY_ACTION/);
  const cli=fileURLToPath(new URL('./ql340b-ceremony.mjs',import.meta.url));
  const help=spawnSync(process.execPath,[cli,'--help'],{encoding:'utf8',timeout:5000});
  assert.equal(help.status,0);assert.equal(JSON.parse(help.stdout).liveConnection,false);
});

test('Windows-only: signed synthetic record and public pins stay in a private ACL directory',
  {skip:process.platform!=='win32'},async()=>{
    const dir=mkdtempSync(join(tmpdir(),'ql340b-windows-private-test-'));
    const prior=process.env.LOCALAPPDATA;process.env.LOCALAPPDATA=dir;
    try{
      const issuedAt=Date.now();
      const r=createEnrollmentRequest({...candidates,witnessHashes,now:issuedAt});
      const s=signOwnerRequest({request:r,role:'source',localCandidate:source.publicCandidate,
        encryptedPrivateKeyPem:source.encryptedPrivateKeyPem,
        passphrase:'not-a-real-source-passphrase',now:issuedAt});
      const m=signOwnerRequest({request:r,role:'master',localCandidate:master.publicCandidate,
        encryptedPrivateKeyPem:master.encryptedPrivateKeyPem,
        passphrase:'not-a-real-master-passphrase',now:issuedAt});
      const requestPath=join(dir,'request.json'),sourcePath=join(dir,'source.json'),
        masterPath=join(dir,'master.json');
      writeFileSync(requestPath,JSON.stringify(r));
      writeFileSync(sourcePath,JSON.stringify(s));
      writeFileSync(masterPath,JSON.stringify(m));
      const result=await runCeremonyCli(['--assemble',requestPath,sourcePath,masterPath]);
      assert.equal(result.databaseEnrollmentCreated,false);
      assert.equal(result.receiverActivated,false);
      assert.equal(existsSync(result.pinsPath),true);
      assert.equal(existsSync(result.enrollmentPath),true);
      await assert.rejects(()=>runCeremonyCli(['--assemble',requestPath,sourcePath,masterPath]),
        /DENY_EXISTING_SIGNED_ENROLLMENT_NO_OVERWRITE/);
    }finally{process.env.LOCALAPPDATA=prior;}
  });
