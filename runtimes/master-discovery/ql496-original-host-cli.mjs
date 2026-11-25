#!/usr/bin/env node
/** Original owner Windows inspection; QL-496 never opens a port or sends. */
import {resolve,isAbsolute,sep} from 'node:path';
import {lstatSync} from 'node:fs';
import {createQl495MasterTrialJournal}
 from './ql495-source-provenance-master-trial.mjs';
import {createQl496MasterReceiverLedger}
 from './ql496-master-endpoint-contract.mjs';
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
const base=()=>resolve(process.env.LOCALAPPDATA??'C:\\',
 'Rosevear','CommsHub','Private');
function main(){
 const arg=process.argv[2];
 if(arg==='--status'&&process.argv.length===3){
  console.log(JSON.stringify({
   state:'QL496_MASTER_RECEIVER_OFF_BY_DEFAULT',
   originalHostCandidate:original(),
   masterEndpointListening:false,automaticMasterSend:false,
   firstSourceFieldCertified:false,originalDevicePhysicallyCertified:false,
   independentSignedDeliveryCertified:false,customerWrites:false}));
  return;
 }
 if(arg!=='--evidence-summary'||process.argv.length!==3||!original()||
  !process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  throw Error('QL496_ORIGINAL_INTERACTIVE_OWNER_READ_ONLY_REQUIRED');
 const directory=base();
 const st=lstatSync(directory);
 if(!st.isDirectory()||st.isSymbolicLink()||
  !directory.toLowerCase().startsWith(
   (resolve(process.env.LOCALAPPDATA)+sep).toLowerCase()))
  throw Error('QL496_OWNER_PRIVATE_DIRECTORY_UNSAFE');
 const client=createQl495MasterTrialJournal({directory}).summary();
 const receiver=createQl496MasterReceiverLedger({directory}).summary();
 console.log(JSON.stringify({
  state:client.state==='HOLD'||receiver.state==='HOLD'?
   'HOLD':'QL496_PRIVATE_RECEIPT_LEDGER_COUNTS_READ_ONLY',
  priorClientSignedMasterTrials:client.trialReceipts??null,
  localMasterContractReceipts:receiver.count??null,
  clientLedgerHead:client.lastDigest??null,
  receiverLedgerHead:receiver.lastDigest??null,
  actualMasterListenerObserved:false,
  realSourceFieldCertified:false,originalDevicePhysicallyCertified:false,
  productionMasterAccepted:false,customerWrites:false}));
 if(client.state==='HOLD'||receiver.state==='HOLD')process.exitCode=2;
}
try{main()}catch(e){
 console.error(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('QL496_')?e.message:
   'QL496_ORIGINAL_OWNER_PRIVATE_EVIDENCE_NOT_ENROLLED'}));
 process.exitCode=1;
}
