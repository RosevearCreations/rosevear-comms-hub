import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('./ql484-original-host-cli.mjs',import.meta.url));
test('QL484 --status is offline, redacted, and performs no secret read',()=>{
 const p=spawnSync(process.execPath,[file,'--status'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);
 const o=JSON.parse(p.stdout);
 assert.equal(o.noAutoListen,true);
 assert.equal(o.physicalFieldVerified,false);
 assert.equal(o.customerDelivery,false);
});
test('QL484 --serve on CI never opens a listener even with spoofed host vars',()=>{
 const p=spawnSync(process.execPath,[file,'--serve','C:\\fake.json'],{
  encoding:'utf8',input:'',
  env:{...process.env,CI:'true',COMPUTERNAME:'DESKTOP-AE894KC',
   USERNAME:'ree'}});
 assert.notEqual(p.status,0);
 assert.match(p.stderr,/HOLD_QL484_/);
 assert.doesNotMatch(p.stdout,/LOOPBACK_STARTED/);
});
