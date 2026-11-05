import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startConfiguredPrivateReceiver} from './server.mjs';

test('private service explicitly starts only on loopback with reviewed owner pin file and DB',async t=>{
  const directory=mkdtempSync(join(tmpdir(),'ql339b-private-host-'));
  t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const path=join(directory,'pinned-authorities.json');
  writeFileSync(path,JSON.stringify({schema:'rosevear.hub.ql339b.owner-authorities.v1',
    source:{keyId:'s-owner',publicKeyPem:'source public key placeholder'},
    master:{keyId:'m-owner',publicKeyPem:'master public key placeholder'}}),{mode:0o600});
  let closed=false;
  const pool={query:async()=>({rows:[]}),connect:async()=>{
    throw Error('no write expected');},end:async()=>{closed=true;}};
  const options={connectionString:'postgresql://example.invalid/private',
    authorityConfigPath:path,poolFactory:async()=>pool,port:0};
  const server=await startConfiguredPrivateReceiver(options);
  assert.equal(server.address().address,'127.0.0.1');
  const ping=await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(ping.status,404);
  await new Promise(resolve=>server.close(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(closed,true);
  await assert.rejects(()=>startConfiguredPrivateReceiver({...options,connectionString:''}),
    /PRIVATE_HOST_POSTGRES/);
});
