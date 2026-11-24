#!/usr/bin/env node
/**
 * QL-493 original Ree Windows owner-only offline Master audit and explicit
 * single-source mTLS transport probe. NO unattended network or source writes.
 */
import {lstatSync,readFileSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {probeQl488PrivateEndpoint} from './ql488-original-host-transport.mjs';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
import {inspectQl493MtlSReadiness,createQl493HandoffJournal,
 createQl493MasterHandoff} from './ql493-private-source-master-handoff.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const PIN_KEYS=['ownerPublicKeyPem','reviewerPublicKeyPem','masterPublicKeyPem'];
const exact=(x,k)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===k.length&&k.every(y=>Object.hasOwn(x,y));
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
const fail=x=>{throw Error('QL493_'+x)};
function root(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('LOCALAPPDATA_OWNER_PRIVATE_ROOT_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function privatePath(file,asFile=true){
 if(typeof file!=='string'||!isAbsolute(file)||file.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const p=resolve(file);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('PATH_OUTSIDE_OWNER_PRIVATE_ROOT');
 const st=lstatSync(p);
 if(st.isSymbolicLink()||
   (asFile&&(!st.isFile()||st.size>250000))||
   (!asFile&&!st.isDirectory()))
  fail('PRIVATE_FILE_OR_FOLDER_UNSAFE');
 return p;
}
const json=file=>JSON.parse(readFileSync(privatePath(file),'utf8'));
async function approve(phrase){
 if(!original()||!process.stdin.isTTY||!process.stdout.isTTY)
  fail('INTERACTIVE_ORIGINAL_OWNER_APPROVAL_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{const answer=await rl.question('Type '+phrase+': ');
  if(answer!==phrase)fail('EXPLICIT_ONE_ACTION_OWNER_APPROVAL_REQUIRED')}
 finally{rl.close()}
}
function fromOwnerConfig(path){
 const cfg=json(path);
 if(!exact(cfg,CONFIG))fail('EXACT_EXISTING_QL489_PRIVATE_TRUST_REQUIRED');
 const directory=privatePath(cfg.evidenceDirectory,false);
 return {cfg,directory};
}
function fromMasterPins(path){
 const pins=json(path);
 if(!exact(pins,PIN_KEYS))fail('EXACT_INDEPENDENTLY_ENROLLED_MASTER_KEYS_REQUIRED');
 return pins;
}
async function run(){
 const action=process.argv[2];
 if(action==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({state:'QL493_PRIVATE_ENROLLMENT_OFF_BY_DEFAULT',
   originalHostCandidate:original(),verifiedLiveSources:0,
   masterNetworkDelivery:false,automaticProbe:false,
   automaticHandoff:false,physicalFieldCertification:false,
   customerWrites:false}));return;
 }
 if(!original())fail('ORIGINAL_REE_WINDOWS_MANUAL_HOST_REQUIRED');
 if(action==='--preflight'&&process.argv.length===4||
   action==='--probe'&&process.argv.length===5){
  const data=json(process.argv[3]);
  if(!exact(data,['endpoints']))
   fail('EXACT_EXISTING_QL488_SIX_SOURCE_ENDPOINT_FILE_REQUIRED');
  const report=inspectQl493MtlSReadiness({endpoints:data.endpoints});
  if(action==='--preflight'){
   console.log(JSON.stringify(report));
   if(report.state==='HOLD')process.exitCode=2;
   return;
  }
  const id=process.argv[4];
  if(!QL485_SOURCE_IDS.includes(id))fail('KNOWN_ONE_SOURCE_ID_REQUIRED');
  if(report.state!=='SIX_SOURCE_MTLS_LOCAL_PREREQUISITES_VALIDATED_NOT_CONNECTED')
   fail('SIX_REAL_PINNED_MTLS_PREREQUISITES_REQUIRED');
  await approve('PROBE ONE REAL PINNED SOURCE');
  // Explicit single GET to already-pinned TLS 1.3 endpoint. Raw signed
  // response is deliberately discarded; never print source or customer data.
  const probe=await probeQl488PrivateEndpoint(data.endpoints[id]);
  const result={state:probe.state==='MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED'?
   'QL493_REAL_MTLS_TRANSPORT_OBSERVED_SOURCE_UNVERIFIED':'HOLD',
   sourceId:id,reason:probe.reason??null,
   tlsTransportObserved:probe.state==='MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',
   originalSourceSignerVerified:false,productionAcceptance:false,
   masterDelivery:false,customerWrites:false};
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 if(!(action==='--audit'&&process.argv.length===5||
   ['--stage','--ack'].includes(action)&&process.argv.length===6))
  fail('VALID_ORIGINAL_OWNER_ACTION_AND_ARGUMENTS_REQUIRED');
 const {cfg,directory}=fromOwnerConfig(process.argv[3]);
 const pins=fromMasterPins(process.argv[4]);
 const ql491=createQl491ReviewJournal({directory});
 const ql492=createQl492PrivateWitnessLedger({directory});
 const review=createQl492FieldReview({directory,ql491Journal:ql491,
  ql492Ledger:ql492,exceptionPins:cfg.exceptionPins});
 const journal=createQl493HandoffJournal({directory});
 const handoff=createQl493MasterHandoff({readAudit:()=>review.auditReadback(),
  journal,pins});
 if(action==='--audit'){
  const result=handoff.audit();
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const input=json(process.argv[5]);
 if(action==='--stage'&&!exact(input,['ownerPacket','reviewerPacket'])||
    action==='--ack'&&!exact(input,['masterPacket']))
  fail('EXACT_INDEPENDENTLY_SIGNED_PRIVATE_PACKETS_REQUIRED');
 await approve(action==='--stage'?
  'STAGE ONE SIGNED OFFLINE MASTER HANDOFF':'RECORD ONE SIGNED MASTER ACK PACKET');
 const result=action==='--stage'?handoff.stage(input):
  handoff.recordMasterAck(input);
 console.log(JSON.stringify(result));
 if(result.state==='HOLD')process.exitCode=2;
}
run().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL493_')?e.message:
   'QL493_REAL_PRIVATE_ENROLLMENT_OR_SIGNED_EVIDENCE_MISSING'}));
 process.exitCode=1;
});
