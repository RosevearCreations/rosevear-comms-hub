import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {verifyLocalActivation} from './ql340c-activation-check.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const source=generateKeyPairSync('ed25519');
const master=generateKeyPairSync('ed25519');
const device=generateKeyPairSync('ed25519');
const keyPem=k=>k.publicKey.export({type:'spki',format:'pem'});
const shaKey=k=>hash(k.publicKey.export({type:'spki',format:'der'}));
const pins={schema:'rosevear.hub.ql339b.owner-authorities.v1',
  source:{keyId:'synthetic-source',publicKeyPem:keyPem(source)},
  master:{keyId:'synthetic-master',publicKeyPem:keyPem(master)}};
const at=Date.parse('2026-11-05T23:00:00.000Z');
const payload={schema:'rosevear.hub.relay.enrollment.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:keyPem(device),deviceSpkiSha256:shaKey(device),
  issuedAt:new Date(at).toISOString(),expiresAt:new Date(at+900_000).toISOString(),
  windowsWitnessSha256:hash('synthetic-windows'),
  privateTlsWitnessSha256:hash('synthetic-tls'),
  tailnetAclWitnessSha256:hash('synthetic-acl'),
  rollbackWitnessSha256:hash('synthetic-stop-readiness')};
const signRecord=p=>({payload:p,approvals:Object.fromEntries([['source',source],['master',master]]
  .map(([role,key])=>[role,{keyId:pins[role].keyId,
    signature:sign(null,Buffer.from(`${role}:${canonicalize(p)}`),key.privateKey).toString('base64url')}]))});

test('authentic independent TEST signatures permit only short-lived local startup review',()=>{
  const result=verifyLocalActivation(signRecord(payload),pins,at+1000);
  assert.equal(result.approved,true);
  assert.equal(result.customerCommunications,false);
  assert.equal(result.deviceActions,false);
  assert.equal(result.networkRequests,0);
});
test('expired, forged, incorrect-pinned or differently scoped records remain denied',()=>{
  const enrollment=signRecord(payload);
  assert.equal(verifyLocalActivation(enrollment,pins,at+900_001).approved,false);
  assert.equal(verifyLocalActivation(enrollment,{...pins,master:pins.source},at+1).approved,false);
  assert.equal(verifyLocalActivation({...enrollment,payload:{...payload,deviceId:'wrong-hub'}},pins,at+1).approved,false);
  const wrongScope={...payload,keyId:'synthetic-other-device'};
  const result=verifyLocalActivation(signRecord(wrongScope),pins,at+1);
  assert.equal(result.state,'DENY_UNEXPECTED_DEVICE_WORKLOAD_KEY');
  assert.equal(result.approved,false);
});
test('Windows operator is opt-in; schema role has no login, public or device action privileges',()=>{
  const operator=readFileSync(new URL('./ql340c-windows-operator.ps1',import.meta.url),'utf8');
  assert.match(operator,/Read-Host 'Type START_TEST_RECEIVER/);
  assert.match(operator,/ConvertFrom-SecureString/);
  assert.match(operator,/DENY_PROCESS_IDENTITY_NOT_RECEIVER/);
  assert.match(operator,/Get-NetTCPConnection -LocalPort 8788/);
  assert.doesNotMatch(operator,/Register-ScheduledTask|tailscale\.exe serve --bg|Start-Service/);
  const sql=readFileSync(new URL('../../supabase/migrations/20261105235404_ql340c_private_receiver_role_and_rls.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE ROLE ql340c_private_receiver NOLOGIN/);
  assert.match(sql,/NOBYPASSRLS/);
  assert.match(sql,/FOR SELECT TO ql340c_private_receiver/);
  assert.match(sql,/FOR INSERT TO ql340c_private_receiver/);
  assert.match(sql,/connection_state='HOLD'/);
  assert.doesNotMatch(sql,/GRANT (UPDATE|DELETE|TRUNCATE|ALL) .* TO ql340c_private_receiver/);
});
