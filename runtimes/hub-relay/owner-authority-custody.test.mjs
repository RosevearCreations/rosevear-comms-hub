import assert from 'node:assert/strict';
import {createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {CANDIDATE_SCHEMA,createOwnerAuthorityCandidate,
  inspectPublicAuthorityCandidate} from './owner-authority-custody.mjs';

test('separate source/master owner keypairs are encrypted, role scoped, and public-only',()=>{
  const a=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340',
    passphrase:'source-owner-only-passphrase'});
  const b=createOwnerAuthorityCandidate({role:'master',keyId:'master-owner-ql340',
    passphrase:'master-owner-only-passphrase'});
  for(const [role,x,secret] of [['source',a,'source-owner-only-passphrase'],
    ['master',b,'master-owner-only-passphrase']]){
    assert.equal(x.publicCandidate.schema,CANDIDATE_SCHEMA);
    assert.equal(x.publicCandidate.role,role);
    assert.equal(x.publicCandidate.enrollmentAuthorized,false);
    assert.match(x.encryptedPrivateKeyPem,/BEGIN ENCRYPTED PRIVATE KEY/);
    assert.doesNotMatch(JSON.stringify(x.publicCandidate),/PRIVATE KEY|passphrase/);
    assert.equal(inspectPublicAuthorityCandidate(x.publicCandidate,role).verified,true);
    assert.equal(inspectPublicAuthorityCandidate(x.publicCandidate,role==='source'?'master':'source').verified,false);
    const privateKey=createPrivateKey({key:x.encryptedPrivateKeyPem,format:'pem',passphrase:secret});
    const payload=Buffer.from(`proof:${role}`);
    assert.equal(verify(null,payload,createPublicKey(x.publicCandidate.publicKeyPem),
      sign(null,payload,privateKey)),true);
    assert.throws(()=>createPrivateKey({key:x.encryptedPrivateKeyPem,format:'pem',passphrase:'wrong-secret'}));
  }
  assert.notEqual(a.publicCandidate.spkiSha256,b.publicCandidate.spkiSha256);
  assert.notEqual(a.publicCandidate.publicKeyPem,b.publicCandidate.publicKeyPem);
});

test('invalid role, weak password, invalid ID and altered device pins fail closed',()=>{
  for(const input of [{role:'admin',keyId:'admin-1',passphrase:'long-passphrase-here'},
    {role:'source',keyId:'Bad-ID',passphrase:'long-passphrase-here'},
    {role:'master',keyId:'master-1',passphrase:'weak'}]){
    assert.throws(()=>createOwnerAuthorityCandidate(input),/DENY_OWNER_AUTHORITY_PARAMETERS/);
  }
  const issued=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340',
    passphrase:'valid-owner-passphrase'});
  assert.equal(inspectPublicAuthorityCandidate({...issued.publicCandidate,
    spkiSha256:'0'.repeat(64)},'source').verified,false);
  assert.equal(inspectPublicAuthorityCandidate({...issued.publicCandidate,
    enrollmentAuthorized:true},'source').verified,false);
});

test('off-Windows or noninteractive CLI cannot create an authority or trust receipt',()=>{
  const runner=fileURLToPath(new URL('./owner-authority-custody.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[runner,'--create','source','source-ql340'],
    {encoding:'utf8',timeout:5000});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/ORIGINAL_WINDOWS_OWNER_REQUIRED|OWNER_INTERACTIVE_TERMINAL_REQUIRED/);
  const unknown=spawnSync(process.execPath,[runner,'--activate'],
    {encoding:'utf8',timeout:5000});
  assert.notEqual(unknown.status,0);
  assert.match(unknown.stderr,/DENY_UNAPPROVED_OWNER_AUTHORITY_ACTION/);
});
