#!/usr/bin/env node
/** Original Ree Windows owner-only QL-492. Offline, inert by default. */
import {lstatSync,readFileSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
const KEYS=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
function fail(x){throw Error('QL492_'+x)}
function root(){
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('LOCALAPPDATA_OWNER_PRIVATE_ROOT_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function underRoot(file,asFile=true){
 if(typeof file!=='string'||!isAbsolute(file)||file.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const p=resolve(file);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('PATH_OUTSIDE_OWNER_PRIVATE_ROOT');
 const stat=lstatSync(p);
 if(asFile&&(!stat.isFile()||stat.isSymbolicLink()||stat.size>250000)||
  !asFile&&(!stat.isDirectory()||stat.isSymbolicLink()))
  fail('OWNER_PRIVATE_FILE_OR_FOLDER_UNSAFE');
 return p;
}
const json=file=>JSON.parse(readFileSync(underRoot(file),'utf8'));
async function approve(kind){
 if(!process.stdin.isTTY||!process.stdout.isTTY||!original())
  fail('INTERACTIVE_ORIGINAL_OWNER_APPROVAL_REQUIRED');
 const phrase=kind==='--intake'?'RECORD ONE SIGNED FIELD REVIEW CLAIM':
  'RECORD ONE SIGNED DUE REVIEW NO SEND';
 const rl=createInterface({input:process.stdin,output:process.stdout});
 try{const r=await rl.question('Type '+phrase+': ');
  if(r!==phrase)fail('EXPLICIT_ONE_ACTION_OWNER_APPROVAL_REQUIRED')}
 finally{rl.close()}
}
async function run(){
 const action=process.argv[2];
 if(action==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({state:'QL492_NO_SEND_OFF_BY_DEFAULT',
   originalHostCandidate:original(),realFieldProofsCertified:0,
   genuineSourceConnectionsVerified:0,masterDelivery:false,
   automaticEscalation:false,customerWrites:false}));return;
 }
 if(!original()||!(action==='--audit'&&process.argv.length===4||
  ['--intake','--escalate'].includes(action)&&process.argv.length===5))
  fail('ORIGINAL_WINDOWS_MANUAL_ACTION_REQUIRED');
 const cfg=json(process.argv[3]);
 if(!exact(cfg,KEYS))fail('EXACT_EXISTING_QL489_PRIVATE_TRUST_CONFIG_REQUIRED');
 const directory=underRoot(cfg.evidenceDirectory,false);
 const journal=createQl491ReviewJournal({directory});
 const ledger=createQl492PrivateWitnessLedger({directory});
 const review=createQl492FieldReview({directory,ql491Journal:journal,ql492Ledger:ledger,
  exceptionPins:cfg.exceptionPins});
 if(action==='--audit'){
  const result=review.auditReadback();
  console.log(JSON.stringify(result));
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const input=json(process.argv[4]);
 if(!exact(input,['ownerPacket','reviewerPacket']))
  fail('TWO_SEPARATELY_SIGNED_PACKETS_REQUIRED');
 await approve(action);
 const result=action==='--intake'?review.acceptProof(input):review.escalateDue(input);
 console.log(JSON.stringify(result));
 if(result.state==='HOLD')process.exitCode=2;
}
run().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL492_')?e.message:
   'QL492_PRIVATE_ACTION_UNAVAILABLE_OR_ENROLLMENT_MISSING'}));
 process.exitCode=1;
});
