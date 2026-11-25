#!/usr/bin/env node
/** QL-495 original Windows owner CLI. No network except explicit --trial. */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
import {createQl493HandoffJournal,createQl493MasterHandoff}
 from './ql493-private-source-master-handoff.mjs';
import {createQl494FirstSourceJournal}
 from './ql494-first-source-receiver.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {QL495_TRIAL_SCHEMA,inspectQl495AttestationDrift,
 createQl495ReceiptProvenance,createQl495MasterTrialJournal,
 validateQl495MasterEndpoint,trialQl495PrivateMasterDelivery}
 from './ql495-source-provenance-master-trial.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const MASTERS=['ownerPublicKeyPem','reviewerPublicKeyPem','masterPublicKeyPem'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
const fail=code=>{throw Error('QL495_'+code)};
function root(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('OWNER_LOCALAPPDATA_ROOT_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function ownerPrivate(path,asFile=true){
 if(typeof path!=='string'||!isAbsolute(path)||path.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const p=resolve(path);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('FILE_OUTSIDE_OWNER_PRIVATE_ROOT');
 const st=lstatSync(p);
 if(st.isSymbolicLink()||
  (asFile&&(!st.isFile()||st.size<1||st.size>250000))||
  (!asFile&&!st.isDirectory()))
  fail('PRIVATE_FILE_OR_DIRECTORY_UNSAFE');
 return p;
}
const load=path=>JSON.parse(readFileSync(ownerPrivate(path),'utf8'));
async function approve(){
 if(!original()||!process.stdin.isTTY||!process.stdout.isTTY)
  fail('INTERACTIVE_ORIGINAL_WINDOWS_OWNER_REQUIRED');
 const phrase='SEND ONE PINNED PRIVATE MASTER TRIAL NO PRODUCTION ACCEPTANCE';
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{
  const ans=await rl.question('Type '+phrase+': ');
  if(ans!==phrase)fail('EXPLICIT_TRIAL_OWNER_APPROVAL_REQUIRED');
 }finally{rl.close()}
}
async function main(){
 const action=process.argv[2];
 if(action==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({state:'QL495_FIRST_SOURCE_PROVENANCE_TRIAL_OFF_BY_DEFAULT',
   originalHostCandidate:original(),liveFirstSourcesCertified:0,
   realMasterTrialReceiptsVerified:0,masterProductionAcceptance:false,
   automaticNetworkSend:false,customerWrites:false}));
  return;
 }
 if(!original())fail('ORIGINAL_OWNER_WINDOWS_CANDIDATE_REQUIRED');
 const drift=action==='--drift'&&process.argv.length===7,
  provenance=action==='--provenance'&&process.argv.length===10,
  trial=action==='--trial'&&process.argv.length===12;
 if(!drift&&!provenance&&!trial)fail('EXACT_MANUAL_PRIVATE_ACTION_REQUIRED');
 const endpointCfg=load(process.argv[3]),sourceCfg=load(process.argv[4]),
  trust=load(process.argv[5]),masterPins=load(process.argv[6]);
 if(!exact(endpointCfg,['endpoints'])||!exact(sourceCfg,['sourcePins'])||
  !exact(trust,CONFIG)||!exact(masterPins,MASTERS))
  fail('EXISTING_INDEPENDENTLY_ENROLLED_CONFIGS_REQUIRED');
 const endpoints=endpointCfg.endpoints,sourcePins=sourceCfg.sourcePins,
  directory=ownerPrivate(trust.evidenceDirectory,false);
 const pinStatus=inspectQl495AttestationDrift({endpoints,sourcePins,
  approvedPins:trust.pins,ownerPins:trust.ownerPins,
  reviewerPins:trust.reviewerPins});
 if(pinStatus.state==='HOLD'){
  console.log(JSON.stringify(pinStatus));process.exitCode=2;return;
 }
 const ql491=createQl491ReviewJournal({directory});
 const ql492=createQl492PrivateWitnessLedger({directory});
 const field=createQl492FieldReview({directory,ql491Journal:ql491,
  ql492Ledger:ql492,exceptionPins:trust.exceptionPins});
 const ql493=createQl493HandoffJournal({directory});
 const master=createQl493MasterHandoff({readAudit:()=>field.auditReadback(),
  journal:ql493,pins:masterPins});
 const ql494=createQl494FirstSourceJournal({directory});
 const review=createQl495ReceiptProvenance({directory,ql494Journal:ql494,
  readMasterAudit:()=>master.audit(),endpoints,sourcePins,
  approvedPins:trust.pins,ownerPins:trust.ownerPins,
  reviewerPins:trust.reviewerPins});
 if(drift){
  const result=review.reconciliation();
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const signed=load(process.argv[7]),sourceId=process.argv[8],
  receiptId=process.argv[9];
 if(!exact(signed,['sourcePacket','ownerPacket','reviewerPacket'])||
  !QL485_SOURCE_IDS.includes(sourceId))
  fail('EXACT_GENUINE_SOURCE_AND_TWO_REVIEW_PACKET_FILES_REQUIRED');
 const checked=review.review({...signed,sourceId,receiptId});
 if(provenance){
  console.log(JSON.stringify(checked));
  if(checked.state==='HOLD')process.exitCode=2;
  return;
 }
 if(checked.state!=='QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD'||
  checked.trialEligibleWhileSourcePacketFresh!==true)
  fail('Genuine_fresh_source_receipt_and_signed_review_required');
 const entry=load(process.argv[10]),trialId=process.argv[11];
 const ready=validateQl495MasterEndpoint(entry);
 if(ready.state==='HOLD'){
  console.log(JSON.stringify(ready));process.exitCode=2;return;
 }
 const ledger=createQl495MasterTrialJournal({directory});
 const snap=ledger.summary();
 if(snap.state==='HOLD'||ledger.hasTrial(trialId))
  fail('PRIVATE_MASTER_TRIAL_LOG_OR_REPLAY_HOLD');
 await approve();
 const payload={schema:QL495_TRIAL_SCHEMA,trialId,sourceId,receiptId,
  recordDigest:checked.sourceRecordDigest,masterAuditDigest:checked.masterAuditDigest,
  masterJournalHead:checked.masterJournalHead,
  provenanceDigest:checked.provenanceDigest,sentAtMs:Date.now(),
  requestedAction:'ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const result=await trialQl495PrivateMasterDelivery({endpoint:entry,
  requestPayload:payload,masterPublicKeyPem:masterPins.masterPublicKeyPem});
 if(result.state==='HOLD'){
  console.log(JSON.stringify(result));process.exitCode=2;return;
 }
 // Exact verified signing result must be saved to private durable receipt log.
 const durable=ledger.append({requestPayload:payload,verifiedResult:result});
 console.log(JSON.stringify({...durable,
  pinnedMasterResponseSignatureVerified:true,masterProductionAccepted:false}));
 if(durable.state==='HOLD')process.exitCode=2;
}
main().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL495_')?e.message:
   'QL495_GENUINE_PRIVATE_CONFIG_SIGNED_PROOF_OR_OWNER_ACTION_MISSING'}));
 process.exitCode=1;
});
