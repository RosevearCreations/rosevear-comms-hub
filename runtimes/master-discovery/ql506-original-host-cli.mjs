/**
 * QL-506 deliberately inert original-host evidence inventory.
 * Never schedules a worker, calls a database, sends messages, starts
 * QL-340C, reads service secrets, or claims hardware attestation.
 */
import {join} from 'node:path';
import {hostname,userInfo} from 'node:os';
import {ql504ReadOfflineStatus} from './ql504-private-receipt-worker.mjs';
const original=()=>{
 try{return process.platform==='win32'&&hostname()==='DESKTOP-AE894KC'&&
  userInfo().username.toLowerCase()==='ree'&&
  (process.env.COMPUTERNAME??'').toUpperCase()==='DESKTOP-AE894KC'&&
  typeof process.env.LOCALAPPDATA==='string'&&!!process.env.LOCALAPPDATA;
 }catch{return false}
};
const base={
 build:'QL-506',receiverStarted:false,customerMessageSent:false,
 networkListening:false,serviceInstalledByThisBuild:false,
 privateCredentialRead:false,realProviderReceiptObserved:false,
 independentPhysicalDeviceWitnessed:false,fieldCertified:false
};
const action=process.argv[2]??'--status';
let output;
if(action==='--status'){
 output={...base,state:'CODE_READY_ORIGINAL_FIELD_HOLD',
  action:'Offline status only; no original-host service identity certified.',
  signedEnrollmentVerified:false,signedExceptionReconciled:false};
}else if(action==='--inspect'&&original()){
 const journal=ql504ReadOfflineStatus(join(process.env.LOCALAPPDATA,
  'Rosevear','CommsHub','Private','ql504-signed-receipts.jsonl'));
 output={...base,state:'ORIGINAL_HOST_NAME_CHECK_ONLY_FIELD_HOLD',
  journalState:journal.state,
  journalJobCount:Number.isSafeInteger(journal.jobCount)?journal.jobCount:null,
  journalDeadLetters:Number.isSafeInteger(journal.DEAD_LETTER)?journal.DEAD_LETTER:null,
  signedEnrollmentVerified:false,signedExceptionReconciled:false,
  serviceIdentityAttested:false,originalHostPhysicallyWitnessed:false};
}else{
 output={...base,state:'HOLD',
  reason:action==='--inspect'?
   'QL506_ORIGINAL_REE_WINDOWS_REQUIRED':
   'QL506_MANUAL_PRIVATE_WITNESS_NOT_AUTHORIZED_BY_CLI'};
}
process.stdout.write(JSON.stringify(output)+'\n');
if(output.state==='HOLD')process.exitCode=2;
