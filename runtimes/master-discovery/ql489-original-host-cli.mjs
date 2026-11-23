#!/usr/bin/env node
/** QL-489 interactive original-Windows source capture; no unattended process. */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import {canonicalize} from './manifest.mjs';
import {validateQl488Enrollment} from './ql488-original-host-transport.mjs';
import {createQl486SixSourceRegistry} from './ql486-six-source-registry.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
import {createQl489LiveCapture} from './ql489-live-source-capture.mjs';
const CONFIG=['registryDirectory','evidenceDirectory','endpoints','pins',
 'ownerPins','reviewerPins','windowsHostPublicKeyPem','exceptionPins'];
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const fail=msg=>{throw Error('QL489_'+msg)};
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&process.env.CI!=='true';
const root=()=>{
 if(!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  fail('OWNER_LOCALAPPDATA_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
};
function privatePath(file,asFile=true){
 if(typeof file!=='string'||!isAbsolute(file)||file.split(/[\\/]/).includes('..'))
  fail('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const p=resolve(file);
 if(!p.toLowerCase().startsWith((root()+sep).toLowerCase()))
  fail('OUTSIDE_OWNER_PRIVATE_ROOT');
 if(asFile){
  const st=lstatSync(p);
  if(!st.isFile()||st.isSymbolicLink()||st.size>250000)
   fail('OWNER_PRIVATE_FILE_UNSAFE');
 }
 return p;
}
async function approval(phrase){
 if(!process.stdin.isTTY||!process.stdout.isTTY||!original())
  fail('ORIGINAL_INTERACTIVE_OWNER_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 let value;try{value=await rl.question('Type '+phrase+': ')}
 finally{rl.close()}
 if(value!==phrase)fail('OWNER_APPROVAL_REQUIRED');
}
async function run(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  console.log(JSON.stringify({state:'QL489_OFF_BY_DEFAULT',
   originalHostCandidate:original(),liveSourcesConfirmed:0,
   physicalCertification:false,automaticPolling:false,customerWrites:false}));
  return;
 }
 const action=process.argv[2];
 if(!original()||
  !(action==='--capture'&&process.argv.length===6||
    action==='--close-exception'&&process.argv.length===5))
  fail('ORIGINAL_WINDOWS_MANUAL_ACTION_REQUIRED');
 const cfg=JSON.parse(readFileSync(privatePath(process.argv[3]),'utf8'));
 if(!exact(cfg,CONFIG))fail('EXACT_PRIVATE_TRUST_CONFIG_REQUIRED');
 cfg.registryDirectory=privatePath(cfg.registryDirectory,false);
 cfg.evidenceDirectory=privatePath(cfg.evidenceDirectory,false);
 validateQl488Enrollment(cfg.endpoints);
 const registry=createQl486SixSourceRegistry({directory:cfg.registryDirectory,
  pins:cfg.pins,ownerPins:cfg.ownerPins,reviewerPins:cfg.reviewerPins});
 const journal=createQl489EvidenceJournal({directory:cfg.evidenceDirectory});
 if(journal.summary().state==='HOLD')fail('JOURNAL_TAMPERED');
 let signWitness=async()=>{fail('HOST_SIGNER_NOT_AVAILABLE')};
 if(action==='--capture'){
  const key=createPrivateKey(readFileSync(privatePath(process.argv[5]),'utf8'));
  if(key.asymmetricKeyType!=='ed25519'||
   createPublicKey(key).export({type:'spki',format:'der'}).toString('hex')!==
   createPublicKey(cfg.windowsHostPublicKeyPem).export({type:'spki',format:'der'}).toString('hex'))
   fail('HOST_SIGNER_NOT_PINNED');
  signWitness=async payload=>({payload,signature:sign(null,
   Buffer.from(canonicalize(payload)),key).toString('base64url')});
 }
 const capture=createQl489LiveCapture({...cfg,registry,journal,signWitness});
 if(action==='--capture'){
  const id=process.argv[4];
  if(!Object.hasOwn(cfg.endpoints,id))fail('SOURCE_NOT_ENROLLED');
  await approval('CAPTURE ONE SIGNED SOURCE');
  const result=await capture.captureOne(id,{supervised:true});
  console.log(JSON.stringify(result)); // hashes and state only; no source/customer bytes
  if(result.state==='HOLD')process.exitCode=2;
  return;
 }
 const input=JSON.parse(readFileSync(privatePath(process.argv[4]),'utf8'));
 if(!exact(input,['sourceId','captureRecordDigest','operatorPacket','reviewerPacket']))
  fail('EXACT_TWO_SIGNED_EXCEPTION_PACKETS_REQUIRED');
 await approval('CLOSE ONE SIGNED EXCEPTION');
 const result=capture.closeException(input);
 console.log(JSON.stringify(result));
 if(result.state==='HOLD')process.exitCode=2;
}
run().catch(e=>{
 console.error(JSON.stringify({state:'HOLD',reason:
  String(e.message).startsWith('QL489_')?e.message:'QL489_PRIVATE_ACTION_UNAVAILABLE'}));
 process.exitCode=1;
});
