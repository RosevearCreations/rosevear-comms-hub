import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const path=fileURLToPath(new URL('./ql485-offline-compatibility-cli.mjs',import.meta.url));
test('QL485 status is offline with six source identities and no source side effects',()=>{
 const r=spawnSync(process.execPath,[path,'--status'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const p=JSON.parse(r.stdout);
 assert.equal(p.sources.length,6);
 assert.equal(p.liveSourceConnections,0);
 assert.equal(p.automaticDeployment,false);
 assert.equal(p.automaticMerge,false);
});
test('QL485 refuses untrusted relative/repository input and does not access remote services',()=>{
 for(const input of ['unsigned.json','./.env']){
  const r=spawnSync(process.execPath,[path,'--review',input],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/HOLD_QL485_/);
  assert.equal(r.stdout,'');
 }
 const r=spawnSync(process.execPath,[path,'--start-server'],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/HOLD_QL485_/);
});
