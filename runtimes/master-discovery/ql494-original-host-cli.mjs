#!/usr/bin/env node
/** QL-494 original Windows owner-only first-source receipt review; OFF by default. */
import {lstatSync,readFileSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {probeQl488PrivateEndpoint} from './ql488-original-host-transport.mjs';
import {inspectQl493MtlSReadiness,createQl493HandoffJournal,
 createQl493MasterHandoff} from './ql493-private-source-master-handoff.mjs';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
import {createQl494FirstSourceJournal,createQl494FirstSourceReceiver,
 inspectQl494AdapterReadiness} from './ql494-first-source-receiver.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const MASTERS=['ownerPublicKeyPem','reviewerPublicKeyPem','masterPublicKeyPem'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
const fail=x=>{throw Error('QL494_'+x)};
function root(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('LOCALAPPDATA_PRIVATE_OWNER_ROOT_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function privateFile(path,file=true){
 if(typeof path!=='string'||!isAbsolute(path)||path.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const p=resolve(path);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('OUTSIDE_ORIGINAL_OWNER_PRIVATE_ROOT');
 const s=lstatSync(p);
 if(s.isSymbolicLink()||
   file&&(!s.isFile()||s.size>250000)||
   !file&&!s.isDirectory())fail('PRIVATE_FILE_OR_FOLDER_UNSAFE');
 return p;
}
const json=p=>JSON.parse(readFileSync(privateFile(p),'utf8'));
async function approval(){
 if(!original()||!process.stdin.isTTY||!process.stdout.isTTY)
  fail('INTERACTIVE_ORIGINAL_OWNER_REQUIRED');
 const phrase='WITNESS ONE FIRST PRIVATE SOURCE RECEIPT NO SEND';
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{const typed=await rl.question('Type '+phrase+': ');
  if(typed!==phrase)fail('EXPLICIT_OWNER_APPROVAL_REQUIRED')}
 finally{rl.close()}
}
async function main(){
 const action=process.argv[2];
 if(action==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({state:'QL494_FIRST_SOURCE_RECEIVER_OFF_BY_DEFAULT',
   originalHostCandidate:original(),verifiedLiveSources:0,
   originalPhysicalWitnessesCertified:0,networkListener:false,
   unattendedTransport:false,masterDelivery:false,customerWrites:false}));
  return;
 }
 if(!original())fail('ORIGINAL_OWNER_WINDOWS_REQUIRED');
 const preflight=action==='--preflight'&&process.argv.length===5;
 const reconcile=action==='--reconcile'&&process.argv.length===7;
 const witness=action==='--witness'&&process.argv.length===9;
 if(!preflight&&!reconcile&&!witness)
  fail('EXACT_PRIVATE_ORIGINAL_OWNER_ACTION_REQUIRED');
 const endpointJson=json(process.argv[3]);
 const sourcePinsJson=json(process.argv[4]);
 if(!exact(endpointJson,['endpoints'])||!exact(sourcePinsJson,['sourcePins']))
  fail('EXACT_SOURCE_CONFIG_AND_PUBLIC_PINS_REQUIRED');
 const endpoints=endpointJson.endpoints,sourcePins=sourcePinsJson.sourcePins;
 const adapter=inspectQl494AdapterReadiness({endpoints,sourcePins});
 const mtls=inspectQl493MtlSReadiness({endpoints});
 if(preflight){
  console.log(JSON.stringify({state:adapter.state==='QL494_SIX_SOURCE_ADAPTER_PIN_FORMAT_READY_NOT_CONNECTED'&&
    mtls.state==='SIX_SOURCE_MTLS_LOCAL_PREREQUISITES_VALIDATED_NOT_CONNECTED'?
    'QL494_LOCAL_ADAPTER_AND_MTLS_PREREQUISITES_READY_NOT_CONNECTED':'HOLD',
   adapterState:adapter.state,mtlsState:mtls.state,
   verifiedLiveSources:0,masterDelivery:false,customerWrites:false}));
  if(adapter.state==='HOLD'||mtls.state==='HOLD')process.exitCode=2;
  return;
 }
 if(adapter.state!=='QL494_SIX_SOURCE_ADAPTER_PIN_FORMAT_READY_NOT_CONNECTED'||
  mtls.state!=='SIX_SOURCE_MTLS_LOCAL_PREREQUISITES_VALIDATED_NOT_CONNECTED')
  fail('INDEPENDENTLY_ENROLLED_SIX_SOURCE_TLS_AND_ADAPTER_PINS_REQUIRED');
 const trust=json(process.argv[5]),masterPins=json(process.argv[6]);
 if(!exact(trust,CONFIG)||!exact(masterPins,MASTERS))
  fail('EXACT_EXISTING_QL489_TRUST_AND_MASTER_PINS_REQUIRED');
 const directory=privateFile(trust.evidenceDirectory,false);
 const ql491=createQl491ReviewJournal({directory});
 const ql492=createQl492PrivateWitnessLedger({directory});
 const reviewer=createQl492FieldReview({directory,ql491Journal:ql491,
  ql492Ledger:ql492,exceptionPins:trust.exceptionPins});
 const ql493=createQl493HandoffJournal({directory});
 const master=createQl493MasterHandoff({readAudit:()=>reviewer.auditReadback(),
  journal:ql493,pins:masterPins});
 const ql494=createQl494FirstSourceJournal({directory});
 const receiver=createQl494FirstSourceReceiver({readMasterAudit:()=>master.audit(),
  journal:ql494,endpoints,sourcePins,ownerPins:trust.ownerPins,
  reviewerPins:trust.reviewerPins});
 if(reconcile){
  const result=receiver.reconcile();
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const signedReview=json(process.argv[7]),sourceId=process.argv[8];
 if(!exact(signedReview,['ownerPacket','reviewerPacket'])||
  !QL485_SOURCE_IDS.includes(sourceId))
  fail('EXACT_ONE_SOURCE_TWO_SIGNATURE_REVIEW_REQUIRED');
 if(signedReview.ownerPacket?.payload?.sourceId!==sourceId||
  signedReview.reviewerPacket?.payload?.sourceId!==sourceId)
  fail('REVIEW_SOURCE_ID_MISMATCH');
 await approval();
 // One explicitly approved TLS 1.3 GET. QL488 verifies pinned certificate,
 // hostname, JSON content type and sourceId; no socket listener or polling.
 const observation=await probeQl488PrivateEndpoint(endpoints[sourceId]);
 const result=receiver.receive({...signedReview,sourceId,observation});
 console.log(JSON.stringify(result)); // metadata hashes only; no source body.
 if(result.state==='HOLD')process.exitCode=2;
}
main().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL494_')?e.message:
  'QL494_GENUINE_PRIVATE_SOURCE_OR_INDEPENDENT_REVIEW_MISSING'}));
 process.exitCode=1;
});
