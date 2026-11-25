#!/usr/bin/env node
/** QL-497 original Windows owner: local client evidence readback only.
 * No enrolment, listener, mTLS probe, network sends, or customer writes. */
import {isAbsolute,resolve,sep} from 'node:path';
import {lstatSync} from 'node:fs';
import {readQl497ClientReceipt} from './ql497-independent-master-enrollment.mjs';
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
const base=()=>resolve(process.env.LOCALAPPDATA??'C:\\',
 'Rosevear','CommsHub','Private');
const err=s=>{throw Error('QL497_'+s)};
function main(){
 const action=process.argv[2];
 if(action==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({
   state:'QL497_INDEPENDENT_MASTER_ENROLLMENT_OFF_BY_DEFAULT',
   originalHostCandidate:original(),
   liveMasterEndpointEnrolled:false,originalDevicePhysicallyCertified:false,
   clientToMasterDeliveryCertified:false,automaticNetworkSend:false,
   customerWrites:false}));
  return;
 }
 if(action!=='--local-receipt'||process.argv.length!==4||!original()||
  !process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  err('ORIGINAL_OWNER_READ_ONLY_COMMAND_REQUIRED');
 const directory=base(),parent=resolve(process.env.LOCALAPPDATA);
 if(!directory.toLowerCase().startsWith((parent+sep).toLowerCase()))
  err('PRIVATE_ROOT_OUTSIDE_USER_PROFILE');
 const st=lstatSync(directory);
 if(!st.isDirectory()||st.isSymbolicLink())err('OWNER_PRIVATE_ROOT_UNSAFE');
 const trialId=process.argv[3];
 const result=readQl497ClientReceipt({directory,trialId});
 if(result.state==='HOLD'){
  console.log(JSON.stringify(result));process.exitCode=2;return;
 }
 console.log(JSON.stringify({state:result.state,trialId,
  receiptDigest:result.record.recordDigest,
  clientJournalHead:result.journalHead,
  sourceId:result.record.sourceId,
  originalClientSignatureReverified:false,
  masterReceiptCompared:false,networkSend:false,
  productionMasterAccepted:false,customerWrites:false}));
}
try{main()}catch(e){
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL497_')?e.message:
   'QL497_GENUINE_LOCAL_ORIGINAL_RECEIPT_NOT_AVAILABLE'}));
 process.exitCode=1;
}
