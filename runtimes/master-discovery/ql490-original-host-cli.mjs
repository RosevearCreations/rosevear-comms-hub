#!/usr/bin/env node
/** QL-490: original Ree Windows owner-only offline readback / manual rehearsal. */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl486SixSourceRegistry} from './ql486-six-source-registry.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
import {readQl490PrivateFieldEvidence} from './ql490-independent-field-readback.mjs';
import {createQl490DrillJournal,createQl490SupervisedRecoveryDrill}
 from './ql490-supervised-recovery-drill.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const fail=msg=>{throw Error('QL490_'+msg)};
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
function root(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('PRIVATE_WINDOWS_LOCALAPPDATA_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function privatePath(path,asFile=true){
 if(typeof path!=='string'||!isAbsolute(path)||path.split(/[\\/]/).includes('..'))
  fail('OWNER_PRIVATE_ABSOLUTE_PATH_REQUIRED');
 const p=resolve(path);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('OUTSIDE_OWNER_PRIVATE_ROOT');
 if(asFile){
  const s=lstatSync(p);
  if(!s.isFile()||s.isSymbolicLink()||s.size>250000)
   fail('PRIVATE_FILE_UNSAFE');
 }
 return p;
}
async function approve(){
 if(!process.stdin.isTTY||!process.stdout.isTTY||!original())
  fail('INTERACTIVE_ORIGINAL_OWNER_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{
  if(await rl.question('Type REHEARSE NO SEND RECOVERY: ')!=='REHEARSE NO SEND RECOVERY')
   fail('OWNER_APPROVAL_REQUIRED');
 }finally{rl.close()}
}
function jsonPrivate(path){
 return JSON.parse(readFileSync(privatePath(path),'utf8'));
}
async function main(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  console.log(JSON.stringify({state:'QL490_NO_SEND_OFF_BY_DEFAULT',
   originalHostCandidate:original(),signedDrillsRun:0,
   liveSourcesIndependentlyCertified:0,automaticRecovery:false,
   customerWrites:false}));return;
 }
 const action=process.argv[2];
 if(!original()||
   !(action==='--readback'&&process.argv.length===5||
     action==='--drill'&&process.argv.length===6))
  fail('ORIGINAL_OWNER_READBACK_OR_DRILL_REQUIRED');
 const cfg=jsonPrivate(process.argv[3]),openCasePackets=jsonPrivate(process.argv[4]);
 if(!exact(cfg,CONFIG)||!Array.isArray(openCasePackets))
  fail('QL489_CONFIG_AND_SIGNED_OPEN_CASE_LIST_REQUIRED');
 cfg.registryDirectory=privatePath(cfg.registryDirectory,false);
 cfg.evidenceDirectory=privatePath(cfg.evidenceDirectory,false);
 const registry=createQl486SixSourceRegistry({directory:cfg.registryDirectory,
  pins:cfg.pins,ownerPins:cfg.ownerPins,reviewerPins:cfg.reviewerPins});
 const journal=createQl489EvidenceJournal({directory:cfg.evidenceDirectory});
 // Pin the clock once so the before/after digest is comparable even if the
 // interactive rehearsal crosses a millisecond boundary.
 const nowMs=Date.now();
 const readCurrent=()=>readQl490PrivateFieldEvidence({
  evidenceDirectory:cfg.evidenceDirectory,registry,journal,
  exceptionPins:cfg.exceptionPins,openCasePackets,nowMs});
 const initial=readCurrent();
 if(initial.state==='HOLD')fail(initial.reason);
 if(action==='--readback'){
  console.log(JSON.stringify(initial));return;
 }
 const input=jsonPrivate(process.argv[5]);
 if(!exact(input,['sourceId','ownerPacket','reviewerPacket'])||
  !Object.hasOwn(cfg.exceptionPins,input.sourceId))
  fail('SIGNED_ONE_SOURCE_RECOVERY_APPROVAL_REQUIRED');
 await approve();
 const drillJournal=createQl490DrillJournal({directory:cfg.evidenceDirectory});
 const trust=cfg.exceptionPins[input.sourceId];
 const drill=createQl490SupervisedRecoveryDrill({readCurrent,drillJournal,
  ownerPublicKeyPem:trust.operatorPublicKeyPem,
  reviewerPublicKeyPem:trust.reviewerPublicKeyPem,
  now:()=>nowMs});
 const result=drill.run({...input,supervised:true});
 // Only hashes, reason codes and statuses; never signatures, keys or customer data.
 console.log(JSON.stringify(result));
 if(result.state==='HOLD')process.exitCode=2;
}
main().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',reason:
  String(e.message).startsWith('QL490_')?e.message:'QL490_PRIVATE_FIELD_READBACK_UNAVAILABLE'}));
 process.exitCode=1;
});
