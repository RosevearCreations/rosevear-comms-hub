import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('./ql483-original-windows-enroll.mjs',import.meta.url));
test('QL483 status reports safe manual-only enrollment without reading any secrets',()=>{
 const result=spawnSync(process.execPath,[cli,'--status'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const status=JSON.parse(result.stdout);
 assert.equal(status.privateServiceListening,false);
 assert.equal(status.firstIncidentAccepted,false);
 assert.equal(status.customerMessaging,false);
 assert.equal(status.autostart,false);
});
test('QL483 no unattended enrollment on CI, even with a forged Windows host label',()=>{
 const result=spawnSync(process.execPath,[cli,'--enroll','C:\\fake-owner.json'],{
  encoding:'utf8',env:{...process.env,COMPUTERNAME:'DESKTOP-AE894KC',
   USERNAME:'ree',CI:'true'},input:''});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/HOLD_QL483_/);
 assert.doesNotMatch(result.stdout,/COMMITTED_HELD/);
});
