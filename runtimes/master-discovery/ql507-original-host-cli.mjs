/**
 * QL-507 safe original-Windows inventory, NO active field witness.
 * No service installation, process startup, network, tokens, private
 * keys, send, receiver or provider access in any mode.
 */
import {hostname,userInfo} from 'node:os';
import {join} from 'node:path';
import {ql504ReadOfflineStatus} from './ql504-private-receipt-worker.mjs';
const original=()=>{
 try{return process.platform==='win32'&&
  hostname()==='DESKTOP-AE894KC'&&
  userInfo().username.toLowerCase()==='ree'&&
  (process.env.COMPUTERNAME??'').toUpperCase()==='DESKTOP-AE894KC'&&
  !!process.env.LOCALAPPDATA;
 }catch{return false}
};
const base={build:'QL-507',fieldCertified:false,
 independentPhysicalWitness:false,credentialCustodyVerified:false,
 providerDeliveryObserved:false,receiverStarted:false,
 customerMessageSent:false,networkListening:false,
 autoStartChanged:false,serviceStarted:false,privateKeyRead:false};
const action=process.argv[2]??'--status';
let output;
if(action==='--status'){
 output={...base,state:'CODE_PREPARATION_ONLY_FIELD_HOLD',
  ownerInstructions:'No action for code promotion; supervised field witness is separate.'};
}else if(action==='--inspect'&&original()){
 const folder=join(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
 const status=ql504ReadOfflineStatus(join(folder,'ql504-signed-receipts.jsonl'));
 output={...base,state:'ORIGINAL_WINDOWS_NAME_MATCH_INVENTORY_ONLY_HOLD',
  journalReadbackState:status.state,
  journalJobs:Number.isSafeInteger(status.jobCount)?status.jobCount:null,
  deadLetterJobs:Number.isSafeInteger(status.DEAD_LETTER)?status.DEAD_LETTER:null,
  serviceInstallState:'NOT_ATTESTED',hardwareDeviceIdentity:'NOT_ATTESTED',
  serviceCredentials:'NOT_INSPECTED'};
}else{
 output={...base,state:'HOLD',
  reason:action==='--inspect'?
   'ORIGINAL_REE_WINDOWS_ONLY':'NO_RECEIVER_START_SEND_OR_FIELD_PILOT_BY_THIS_CLI'};
}
process.stdout.write(JSON.stringify(output)+'\n');
if(output.state==='HOLD')process.exitCode=2;
