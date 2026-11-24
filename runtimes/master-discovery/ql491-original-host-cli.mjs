#!/usr/bin/env node
/**
 * QL-491: original owner Windows-only private case/drill readback, manual
 * field-proof FOLLOW-UP request. No external provider calls or auto service.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl486SixSourceRegistry} from './ql486-six-source-registry.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
import {readQl490PrivateFieldEvidence} from './ql490-independent-field-readback.mjs';
import {createQl490DrillJournal} from './ql490-supervised-recovery-drill.mjs';
import {createQl491ReviewJournal,createQl491ExceptionIntake}
 from './ql491-exception-intake.mjs';
import {readQl491DrillTrends} from './ql491-drill-trends.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(f=>Object.hasOwn(o,f));
const fail=reason=>{throw Error('QL491_'+reason)};
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
function privateRoot(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('LOCALAPPDATA_OWNER_PRIVATE_ROOT_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function privatePath(file,needsFile=true){
 if(typeof file!=='string'||!isAbsolute(file)||file.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_OWNER_PRIVATE_PATH_REQUIRED');
 const resolved=resolve(file);
 if(!resolved.toLowerCase().startsWith((privateRoot()+sep).toLowerCase()))
  fail('OUTSIDE_OWNER_PRIVATE_ROOT');
 if(needsFile){
  const st=lstatSync(resolved);
  if(!st.isFile()||st.isSymbolicLink()||st.size>250000)
   fail('OWNER_PRIVATE_FILE_TYPE_OR_SIZE_HOLD');
 }
 return resolved;
}
function readJson(file){
 return JSON.parse(readFileSync(privatePath(file),'utf8'));
}
async function approval(){
 if(!original()||!process.stdin.isTTY||!process.stdout.isTTY)
  fail('EXPLICIT_ORIGINAL_INTERACTIVE_OWNER_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{
  const answer=await rl.question('Type REQUEST ONE FIELD PROOF REVIEW (NO SEND): ');
  if(answer!=='REQUEST ONE FIELD PROOF REVIEW (NO SEND)')
   fail('EXPLICIT_OWNER_APPROVAL_REQUIRED');
 }finally{rl.close()}
}
async function main(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  console.log(JSON.stringify({state:'QL491_NO_SEND_OFF_BY_DEFAULT',
   originalHostCandidate:original(),realFieldProofsCertified:0,
   automatedFollowup:false,providerConnections:0,customerWrites:false}));return;
 }
 const action=process.argv[2];
 if(!original()||
   !(action==='--review'&&process.argv.length===5||
     action==='--trends'&&process.argv.length===4||
     action==='--followup'&&process.argv.length===6))
  fail('ORIGINAL_WINDOWS_MANUAL_READBACK_REQUIRED');
 const cfg=readJson(process.argv[3]);
 if(!exact(cfg,CONFIG))
  fail('EXACT_Ql489_PRIVATE_TRUST_CONFIG_REQUIRED');
 cfg.registryDirectory=privatePath(cfg.registryDirectory,false);
 cfg.evidenceDirectory=privatePath(cfg.evidenceDirectory,false);
 if(action==='--trends'){
  const journal=createQl490DrillJournal({directory:cfg.evidenceDirectory});
  const result=readQl491DrillTrends({directory:cfg.evidenceDirectory,
   drillJournal:journal});
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const signedOpenCasePackets=readJson(process.argv[4]);
 if(!Array.isArray(signedOpenCasePackets))
  fail('JSON_ARRAY_OF_SIGNED_CASES_REQUIRED');
 const registry=createQl486SixSourceRegistry({directory:cfg.registryDirectory,
  pins:cfg.pins,ownerPins:cfg.ownerPins,reviewerPins:cfg.reviewerPins});
 const evidence=createQl489EvidenceJournal({directory:cfg.evidenceDirectory});
 const reviewJournal=createQl491ReviewJournal({directory:cfg.evidenceDirectory});
 const readCurrent=()=>readQl490PrivateFieldEvidence({evidenceDirectory:cfg.evidenceDirectory,
  registry,journal:evidence,exceptionPins:cfg.exceptionPins,
  openCasePackets:signedOpenCasePackets});
 const intake=createQl491ExceptionIntake({readCurrent,journal:reviewJournal});
 if(action==='--review'){
  const result=intake.reconcile(signedOpenCasePackets);
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const request=readJson(process.argv[5]);
 if(!exact(request,['sourceId','ownerPacket','reviewerPacket'])||
  !Object.hasOwn(cfg.exceptionPins,request.sourceId))
  fail('EXACT_SIGNED_ONE_SOURCE_REVIEW_REQUEST_REQUIRED');
 await approval();
 const result=intake.requestFollowup({...request,signedOpenCasePackets,
  exceptionPins:cfg.exceptionPins});
 console.log(JSON.stringify(result));
 if(result.state==='HOLD')process.exitCode=2;
}
main().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',reason:
  String(e.message).startsWith('QL491_')?e.message:'QL491_PRIVATE_FIELD_ACTION_UNAVAILABLE'}));
 process.exitCode=1;
});
