import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./ql486-original-host-console-cli.mjs',import.meta.url));
test('QL486 --status is inert and exposes no signer or customer information',()=>{
 const p=spawnSync(process.execPath,[script,'--status'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);
 const result=JSON.parse(p.stdout);
 assert.equal(result.autoListen,false);
 assert.equal(result.sourceConnections,0);
 assert.equal(result.fieldAccepted,false);
 assert.equal(p.stdout.includes('PRIVATE KEY'),false);
});
test('QL486 CI cannot launch receiver, inspect original private secrets or write source contracts',()=>{
 for(const op of ['--serve','--readback','--register']){
  const args=[script,op,'C:\\fake-owner.json'];
  if(op==='--register')args.push('C:\\fake-source.json');
  const p=spawnSync(process.execPath,args,{encoding:'utf8',
   env:{...process.env,CI:'true',COMPUTERNAME:'DESKTOP-AE894KC',USERNAME:'ree'}});
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/HOLD_QL486_ORIGINAL_WINDOWS_OWNER_HOST_SUPERVISION_REQUIRED/);
  assert.equal(p.stdout,'');
 }
});
