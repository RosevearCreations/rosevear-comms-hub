#!/usr/bin/env node
/**
 * QL-486 original Windows owner opt-in registry and operator console.
 * Never a background service, cloud endpoint or CI test of live source.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl486SixSourceRegistry}
 from './ql486-six-source-registry.mjs';
import {createQl486PrivateOperatorRead,createQl486PrivateOperatorHttpsServer,
 QL486_CONSOLE_PATH} from './ql486-private-operator-console.mjs';
const error=code=>{throw Error('HOLD_QL486_'+code)};
const exact=(x,k)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===k.length&&k.every(y=>Object.hasOwn(x,y));
const CONFIG_FIELDS=['registryDirectory','pins','ownerPins','reviewerPins',
 'operatorAcl','serverCaFile','serverCertFile','serverKeyFile'];
const ownerCandidate=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree';
function privateRoot(){
 const root=process.env.LOCALAPPDATA;
 if(typeof root!=='string'||!isAbsolute(root))error('OWNER_LOCALAPPDATA_REQUIRED');
 return resolve(root,'Rosevear','CommsHub','Private');
}
function underRoot(input,isFile=true){
 if(typeof input!=='string'||!isAbsolute(input)||
    input.split(/[\\/]/).includes('..'))error('PRIVATE_ABSOLUTE_PATH_REQUIRED');
 const path=resolve(input),root=privateRoot();
 if(!path.toLowerCase().startsWith((root+sep).toLowerCase()))
  error('PRIVATE_PATH_OUTSIDE_OWNER_ROOT');
 if(isFile){
  const s=lstatSync(path);
  if(!s.isFile()||s.isSymbolicLink()||s.size>150000)
   error('PRIVATE_FILE_UNSAFE_OR_OVERSIZED');
 }
 return path;
}
function configFrom(file){
 const c=JSON.parse(readFileSync(underRoot(file),'utf8'));
 if(!exact(c,CONFIG_FIELDS))error('EXACT_OWNER_TRUST_CONFIG_REQUIRED');
 c.registryDirectory=underRoot(c.registryDirectory,false);
 for(const key of ['serverCaFile','serverCertFile','serverKeyFile'])
  c[key]=underRoot(c[key]);
 return c;
}
async function approve(prompt,phrase){
 if(!process.stdin.isTTY||!process.stdout.isTTY||
  process.env.CI==='true')error('UNATTENDED_OR_CI_NOT_ALLOWED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 let response;
 try{response=await rl.question(prompt)}finally{rl.close()}
 if(response!==phrase)error('EXPLICIT_OWNER_ACTION_REQUIRED');
}
async function run(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  process.stdout.write(JSON.stringify({state:'QL486_PRIVATE_REGISTRY_OFFLINE',
   originalHostCandidate:ownerCandidate(),autoListen:false,
   serverRunning:false,sourceConnections:0,fieldAccepted:false})+'\n');
  return;
 }
 if(!ownerCandidate()||process.env.CI==='true')
  error('ORIGINAL_WINDOWS_OWNER_HOST_SUPERVISION_REQUIRED');
 const action=process.argv[2];
 if(!['--readback','--register','--serve'].includes(action)||
  process.argv.length!==(action==='--register'?5:4))
  error('USE_STATUS_READBACK_REGISTER_OR_SERVE');
 const c=configFrom(process.argv[3]);
 const registry=createQl486SixSourceRegistry({
  directory:c.registryDirectory,pins:c.pins,
  ownerPins:c.ownerPins,reviewerPins:c.reviewerPins});
 if(action==='--readback'){
  const report=registry.summary();
  process.stdout.write(JSON.stringify(report)+'\n');return;
 }
 if(action==='--register'){
  const input=JSON.parse(readFileSync(underRoot(process.argv[4]),'utf8'));
  if(!exact(input,['sourceId','noticePacket','sourceAttestationPacket',
   'ownerPacket','reviewerPacket']))error('EXACT_SIGNED_SOURCE_EVIDENCE_REQUIRED');
  await approve('Type RECORD SIGNED PRIVATE SOURCE EVIDENCE: ',
   'RECORD SIGNED PRIVATE SOURCE EVIDENCE');
  const r=registry.commit(input);
  process.stdout.write(JSON.stringify(r)+'\n');
  if(r.state==='HOLD')process.exitCode=2;
  return;
 }
 await approve('Type OPEN PRIVATE CONTRACT CONSOLE: ',
  'OPEN PRIVATE CONTRACT CONSOLE');
 const reader=createQl486PrivateOperatorRead({
  registry,acl:c.operatorAcl});
 const server=createQl486PrivateOperatorHttpsServer({
  reader,tlsOptions:{ca:readFileSync(c.serverCaFile),
   cert:readFileSync(c.serverCertFile),key:readFileSync(c.serverKeyFile)}});
 const timer=setTimeout(()=>server.close(),120000);timer.unref();
 process.once('SIGINT',()=>server.close());
 try{
  await new Promise((ok,reject)=>{
   server.once('error',reject);server.listen(8846,'127.0.0.1',ok);
  });
  process.stdout.write(JSON.stringify({state:'QL486_LOOPBACK_READ_ONLY_CONSOLE_ON',
   address:'127.0.0.1',port:8846,path:QL486_CONSOLE_PATH,
   maxSeconds:120,sourceConnections:0,
   originalRuntimeVerified:false,automaticActivation:false})+'\n');
  await new Promise((ok,reject)=>{
   server.once('close',ok);server.once('error',reject);
  });
 }finally{clearTimeout(timer)}
}
run().catch(e=>{
 process.stderr.write(JSON.stringify({state:'HOLD',reason:
  String(e.message).startsWith('HOLD_QL486_')?e.message:
  'HOLD_QL486_PRIVATE_OWNER_RUNTIME_UNAVAILABLE'})+'\n');
 process.exitCode=1;
});
