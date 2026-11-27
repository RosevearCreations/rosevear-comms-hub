/**
 * QL-505 owner-local offline status/review. This CLI is deliberately NOT a
 * service installer, scheduled task, TEST receiver, sender or RPC trigger.
 * Actual private one-shot runtime functions live in ql505-private-runtime.
 */
import {join} from 'node:path';
import {hostname,userInfo} from 'node:os';
import {ql504ReadOfflineStatus} from './ql504-private-receipt-worker.mjs';
import {ql505OriginalRuntimeReadiness} from './ql505-private-db-gateway.mjs';
const action=process.argv[2]??'--status';
const original=()=>{
 try{return process.platform==='win32'&&hostname()==='DESKTOP-AE894KC'&&
  userInfo().username.toLowerCase()==='ree'&&
  (process.env.COMPUTERNAME??'').toUpperCase()==='DESKTOP-AE894KC'&&
  !!process.env.LOCALAPPDATA;
 }catch{return false}
};
let status;
if(action==='--status'){
 status={build:'QL-505',state:'CODE_READY_PRIVATE_FIELD_ENROLLMENT_HELD',
  runtime:ql505OriginalRuntimeReadiness(),networkListening:false,
  customerMessageSent:false,receiverStarted:false,
  physicalHostWitnessed:false,providerDeliveryObserved:false};
}else if(action==='--inspect'){
 if(!original()){
  status={build:'QL-505',state:'HOLD',reason:'ORIGINAL_REE_WINDOWS_RUNTIME_REQUIRED',
   receiverStarted:false,customerMessageSent:false};
 }else{
  const file=join(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private',
   'ql504-signed-receipts.jsonl');
  status={build:'QL-505',...ql504ReadOfflineStatus(file),
   originalHostnameMatched:true,physicalHostWitnessed:false,
   customerMessageSent:false,receiverStarted:false};
 }
}else{
 status={build:'QL-505',state:'HOLD',
  reason:'PRIVATE_SUPERVISED_RUNTIME_NOT_ACTIVATED_BY_THIS_CLI',
  receiverStarted:false,customerMessageSent:false};
}
process.stdout.write(JSON.stringify(status)+'\n');
if(action!=='--status'&&status.state==='HOLD')process.exitCode=2;
