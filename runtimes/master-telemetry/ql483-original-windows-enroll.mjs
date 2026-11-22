#!/usr/bin/env node
/**
 * QL-483 original-owner Windows-only one-shot private enrollment.
 * No network, no local receiver, no unattended Windows scheduled task.
 * Not a claim that a Yard Workers original source has been observed.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl480PrivateCaseAdapter} from './ql480-scoped-incident-adapter.mjs';
import {createQl483PrivateYardWorkersLink}
 from './ql483-original-yw-field.mjs';
const HOLD=reason=>{throw Error('HOLD_QL483_'+reason)};
const FIELDS=['directory','journalDirectory','tenantId','expectedRevision',
 'expectedChallengeDigest','clientCertFingerprint','sourceCustodianPin',
 'reviewerPin','operatorPin','sourcePin','icampPin','sourcePacket',
 'reviewerPacket','sourceProofPacket'];
const status=()=>({
 state:'QL483_PRIVATE_SOURCE_ENROLLMENT_NOT_AUTOMATIC',
 originalHostCandidate:process.platform==='win32'&&
  process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
  process.env.USERNAME?.toLowerCase()==='ree',
 privateServiceListening:false,realSourceVerified:false,
 firstIncidentAccepted:false,customerMessaging:false,autostart:false
});
const under=(path,root)=>path.toLowerCase().startsWith(root.toLowerCase()+sep.toLowerCase());
function privateRoot(){
 if(process.platform!=='win32'||!process.env.LOCALAPPDATA)HOLD('WINDOWS_PRIVATE_FOLDER_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
}
function ownerPath(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..'))HOLD('ABSOLUTE_OWNER_FILE_REQUIRED');
 const p=resolve(path),root=privateRoot();
 if(!under(p,root))HOLD('PRIVATE_CONFIG_OUTSIDE_OWNER_PROFILE');
 const stat=lstatSync(p);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>20000)
  HOLD('PRIVATE_CONFIG_NOT_SAFE');
 return p;
}
function ownerFolder(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..')||!under(resolve(path),privateRoot()))
  HOLD('PRIVATE_LEDGER_PATH_REQUIRED');
 return resolve(path);
}
async function main(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  process.stdout.write(JSON.stringify(status())+'\n');return;
 }
 if(process.argv.length!==4||process.argv[2]!=='--enroll')HOLD('USE_STATUS_OR_ENROLL');
 if(!status().originalHostCandidate)HOLD('ORIGINAL_REE_WINDOWS_HOST_REQUIRED');
 if(!process.stdin.isTTY||!process.stdout.isTTY)HOLD('UNATTENDED_ENROLLMENT_DENIED');
 const cfg=JSON.parse(readFileSync(ownerPath(process.argv[3]),'utf8'));
 if(!cfg||typeof cfg!=='object'||Array.isArray(cfg)||
  Object.keys(cfg).length!==FIELDS.length||
  FIELDS.some(k=>!Object.hasOwn(cfg,k)))HOLD('OWNER_CONFIG_FIELDS_INVALID');
 const directory=ownerFolder(cfg.directory),journalDirectory=ownerFolder(cfg.journalDirectory);
 if(directory===journalDirectory)HOLD('SEPARATE_ENROLLMENT_AND_CASE_JOURNAL_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 let answer;
 try{answer=await rl.question('Type ENROLL YARD WORKERS PRIVATE STAGING to continue: ')}
 finally{rl.close()}
 if(answer!=='ENROLL YARD WORKERS PRIVATE STAGING')HOLD('SUPERVISED_APPROVAL_REQUIRED');
 // Source and independent reviewer trust pins must have been verified
 // out-of-band before this command; a host name is NOT cryptographic proof.
 const adapter=createQl480PrivateCaseAdapter({directory:journalDirectory,
  environment:'PRIVATE_STAGING',sourcePins:{
   'yard-workers':cfg.sourcePin,icamp:cfg.icampPin},
  operatorPin:cfg.operatorPin});
 const link=createQl483PrivateYardWorkersLink({directory,adapter,
  sourcePacket:cfg.sourcePacket,reviewerPacket:cfg.reviewerPacket,
  sourceCustodianPin:cfg.sourceCustodianPin,reviewerPin:cfg.reviewerPin,
  operatorPin:cfg.operatorPin,sourcePin:cfg.sourcePin,
  sourceProofPacket:cfg.sourceProofPacket,
  clientCertFingerprint:cfg.clientCertFingerprint,
  expectedChallengeDigest:cfg.expectedChallengeDigest,
  expectedRevision:cfg.expectedRevision,tenantId:cfg.tenantId});
 const result=link.enroll();
 process.stdout.write(JSON.stringify({state:result.state,
  reason:result.reason??null,tenantId:result.tenantId??null,
  enrollmentDigest:result.enrollmentDigest??null,
  originalHostVerified:false,fieldAcceptance:'HOLD',
  privateServiceListening:false,customerMessaging:false})+'\n');
 if(result.state==='HOLD')process.exitCode=1;
}
main().catch(e=>{process.stderr.write(JSON.stringify({
 state:'HOLD',reason:String(e.message).startsWith('HOLD_QL483_')?e.message:
 'HOLD_QL483_PRIVATE_ENROLLMENT_UNAVAILABLE'})+'\n');process.exitCode=1});
