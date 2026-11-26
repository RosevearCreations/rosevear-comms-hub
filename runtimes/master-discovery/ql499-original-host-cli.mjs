#!/usr/bin/env node
/** Original owner-only, explicitly requested TLS 1.3 handshake.
 * Does not perform HTTP GET/POST, send messages, or authorize a receiver.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,join,sep,isAbsolute} from 'node:path';
import {probeQl499ActualTls} from './ql499-original-path-probe.mjs';
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 String(process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
const hold=(reason)=>({state:'HOLD',reason,networkPathCertified:false,
 automaticNetworkSend:false,customerWrites:false});
function privateFile(root,name){
 const p=resolve(root,name);
 if(!p.toLowerCase().startsWith((resolve(root)+sep).toLowerCase()))
  throw Error('QL499_PRIVATE_PATH_ESCAPE');
 const st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size<32||st.size>131072)
  throw Error('QL499_PRIVATE_FILE_INVALID');
 return readFileSync(p);
}
async function main(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  console.log(JSON.stringify({state:'QL499_ORIGINAL_HOST_MTLS_PROBE_NOT_EXECUTED',
   originalHostCandidate:original(),
   actualTlsHandshakeObserved:false,networkPathCertified:false,
   originalDevicePhysicallyCertified:false,
   masterRuntimeActivationCertified:false,deliveryCertified:false,
   automaticNetworkSend:false,customerWrites:false}));
  return;
 }
 if(process.argv.length!==3||process.argv[2]!=='--probe'||!original()||
  !process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  throw Error('QL499_SUPERVISED_ORIGINAL_WINDOWS_OWNER_ONLY');
 const root=resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
 const rst=lstatSync(root);
 if(!rst.isDirectory()||rst.isSymbolicLink())throw Error('QL499_PRIVATE_ROOT_INVALID');
 const config=JSON.parse(privateFile(root,'ql499-owner-approved-probe.json').toString('utf8'));
 const keys=['endpointUrl','serverCertificateSha256','caFile','clientCertificateFile',
  'clientKeyFile','explicitOwnerApproval'];
 if(!config||Array.isArray(config)||typeof config!=='object'||
  Object.keys(config).length!==keys.length||
  keys.some(k=>!Object.hasOwn(config,k))||
  config.explicitOwnerApproval!=='ONE_SUPERVISED_TLS_HANDSHAKE_NO_HTTP')
  throw Error('QL499_MISSING_EXPLICIT_SINGLE_PROBE_AUTHORIZATION');
 const files=['caFile','clientCertificateFile','clientKeyFile'];
 if(files.some(k=>typeof config[k]!=='string'||!/^[A-Za-z0-9_.-]{8,96}$/.test(config[k])))
  throw Error('QL499_PRIVATE_BASENAME_REQUIRED');
 const [caPem,clientCertificatePem,clientKeyPem]=files.map(k=>privateFile(root,config[k]));
 const r=await probeQl499ActualTls({endpointUrl:config.endpointUrl,
  expectedServerCertificateSha256:config.serverCertificateSha256,
  caPem,clientCertificatePem,clientKeyPem});
 console.log(JSON.stringify({...r,originalHostCandidate:true,
  originalWindowsPhysicallyCertified:false,networkPathCertified:false}));
 if(r.state==='HOLD')process.exitCode=2;
}
main().catch(e=>{
 console.error(JSON.stringify(hold(
  String(e.message).startsWith('QL499_')?e.message:'QL499_PRIVATE_PROBE_NOT_READY')));
 process.exitCode=2;
});
