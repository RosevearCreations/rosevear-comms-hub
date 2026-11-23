#!/usr/bin/env node
/** QL-488: supervised original Windows owner transport probe; never unattended. */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {validateQl488Enrollment,probeQl488PrivateEndpoint}
 from './ql488-original-host-transport.mjs';
const fail=reason=>{throw Error('QL488_'+reason)};
const originalCandidate=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree';
const root=()=>resolve(process.env.LOCALAPPDATA??'C:\\invalid','Rosevear','CommsHub','Private');
function configPath(file){
 if(typeof file!=='string'||!isAbsolute(file)||file.split(/[\\/]/).includes('..'))
  fail('PRIVATE_FILE_PATH_REQUIRED');
 const p=resolve(file),base=root();
 if(!p.toLowerCase().startsWith((base+sep).toLowerCase()))
  fail('OUTSIDE_OWNER_PRIVATE_ROOT');
 const st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size>140000)
  fail('PRIVATE_CONFIG_UNSAFE');
 return p;
}
async function approval(){
 if(!process.stdin.isTTY||!process.stdout.isTTY||process.env.CI==='true')
  fail('INTERACTIVE_ORIGINAL_OWNER_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{
  const v=await rl.question('Type PROBE ONE PRIVATE SOURCE: ');
  if(v!=='PROBE ONE PRIVATE SOURCE')fail('OWNER_APPROVAL_REQUIRED');
 }finally{rl.close()}
}
async function run(){
 if(process.argv[2]==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({state:'QL488_PROBE_OFF_BY_DEFAULT',
   originalHostCandidate:originalCandidate(),sourceConnectionsVerified:0,
   automaticProbe:false,customerEffects:false}));return;
 }
 if(process.argv[2]!=='--probe'||process.argv.length!==5||
  !originalCandidate()||process.env.CI==='true')
  fail('SUPERVISED_WINDOWS_OWNER_SOURCE_REQUIRED');
 const [, , ,file,sourceId]=process.argv;
 const data=JSON.parse(readFileSync(configPath(file),'utf8'));
 if(!data||Object.keys(data).length!==1||!Object.hasOwn(data,'endpoints'))
  fail('EXACT_SIX_SOURCE_PRIVATE_CONFIG_REQUIRED');
 validateQl488Enrollment(data.endpoints);
 if(!Object.hasOwn(data.endpoints,sourceId))fail('UNKNOWN_SOURCE');
 await approval();
 const result=await probeQl488PrivateEndpoint(data.endpoints[sourceId]);
 // Never print customer data, source bundles, private trust material or signed packets.
 console.log(JSON.stringify({state:result.state,sourceId,
  reason:result.reason??null,transportObserved:result.state==='MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',
  signedSourceAccepted:false,originalHostVerified:false,
  sourceAuthorized:false,customerEffects:false}));
 if(result.state==='HOLD')process.exitCode=2;
}
run().catch(e=>{console.error(JSON.stringify({state:'HOLD',
 reason:String(e.message).startsWith('QL488_')?e.message:'QL488_PRIVATE_PROBE_UNAVAILABLE'}));process.exitCode=1});
