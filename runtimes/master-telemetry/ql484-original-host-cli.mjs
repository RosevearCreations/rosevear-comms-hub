#!/usr/bin/env node
/**
 * QL-484 supervised ORIGINAL WINDOWS HOST loopback witness service.
 * Requires independently provisioned signer pins, QL-483 enrollment,
 * existing private QL-480 event journal and private mutual-TLS certs.
 * Never installs a task or starts without explicit local terminal approval.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {createQl480PrivateCaseAdapter} from './ql480-scoped-incident-adapter.mjs';
import {createQl482ProtectedCaseReader} from './ql482-protected-case-read.mjs';
import {createQl483PrivateYardWorkersLink} from './ql483-original-yw-field.mjs';
import {createQl484SupervisedYwFieldReview}
 from './ql484-supervised-original-host-field.mjs';
import {createQl484PrivateReviewHttpsServer}
 from './ql484-private-field-https.mjs';

const HOLD=reason=>{throw Error('HOLD_QL484_'+reason)};
const ID=/^[A-Za-z0-9_-]{8,96}$/;
const FIELDS=['journalDirectory','enrollmentDirectory','sessionDirectory',
 'tenantId','operatorId','sourceRevision','commsMainRevision',
 'sourceClientFingerprint','operatorClientFingerprint',
 'expectedChallengeDigest','expectedOwnerChallengeDigest',
 'originalHostId','sourcePin','icampPin','sourceCustodianPin','reviewerPin',
 'operatorPin','ownerHostPin','sourceBindingPacket','reviewerBindingPacket',
 'sourceProofPacket','serverCaPath','serverCertPath','serverKeyPath'];
const originalHostCandidate=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 (process.env.USERNAME??'').toLowerCase()==='ree';
const privateRoot=()=>{
 if(!process.env.LOCALAPPDATA)HOLD('OWNER_LOCALAPPDATA_REQUIRED');
 return resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
};
const within=(path,folder)=>path.toLowerCase().startsWith(folder.toLowerCase()+sep.toLowerCase());
function exact(x,keys){
 return !!x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
}
function ownerPath(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..')||!within(resolve(path),privateRoot()))
  HOLD('PRIVATE_FILE_OUTSIDE_OWNER_ROOT');
 const file=resolve(path),stat=lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>100000)
  HOLD('OWNER_PRIVATE_FILE_UNSAFE');
 return file;
}
function ownerDirectory(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..')||!within(resolve(path),privateRoot()))
  HOLD('PRIVATE_DIRECTORY_OUTSIDE_OWNER_ROOT');
 return resolve(path);
}
async function run(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  process.stdout.write(JSON.stringify({
   state:'QL484_SUPERVISED_PRIVATE_FIELD_SERVICE_OFF',
   originalHostCandidate:originalHostCandidate(),
   noAutoListen:true,customerDelivery:false,physicalFieldVerified:false})+'\n');return;
 }
 if(process.argv.length!==4||process.argv[2]!=='--serve')
  HOLD('USE_STATUS_OR_SUPERVISED_SERVE');
 if(!originalHostCandidate()||process.env.CI==='true'||
  !process.stdin.isTTY||!process.stdout.isTTY)
  HOLD('ORIGINAL_INTERACTIVE_REE_WINDOWS_OWNER_ONLY');
 const c=JSON.parse(readFileSync(ownerPath(process.argv[3]),'utf8'));
 if(!exact(c,FIELDS)||!ID.test(c.operatorId??'')||
   !ID.test(c.originalHostId??''))
  HOLD('EXACT_SIGNER_AND_TENANT_CONFIG_REQUIRED');
 const journalDirectory=ownerDirectory(c.journalDirectory),
  enrollmentDirectory=ownerDirectory(c.enrollmentDirectory),
  sessionDirectory=ownerDirectory(c.sessionDirectory);
 if(new Set([journalDirectory,enrollmentDirectory,sessionDirectory]).size!==3)
  HOLD('SEPARATE_PRIVATE_JOURNAL_ENROLLMENT_AND_SESSIONS_REQUIRED');
 const rl=createInterface({input:process.stdin,output:process.stdout});
 let approval;
 try{
  approval=await rl.question(
   'Type START PRIVATE YW WITNESS to open a 90-second loopback review: ');
 }finally{rl.close()}
 if(approval!=='START PRIVATE YW WITNESS')HOLD('EXPLICIT_OWNER_APPROVAL_REQUIRED');
 const adapter=createQl480PrivateCaseAdapter({directory:journalDirectory,
  environment:'PRIVATE_STAGING',sourcePins:{
   'yard-workers':c.sourcePin,icamp:c.icampPin},operatorPin:c.operatorPin});
 const link=createQl483PrivateYardWorkersLink({directory:enrollmentDirectory,
  adapter,sourcePacket:c.sourceBindingPacket,reviewerPacket:c.reviewerBindingPacket,
  sourceCustodianPin:c.sourceCustodianPin,reviewerPin:c.reviewerPin,
  operatorPin:c.operatorPin,sourcePin:c.sourcePin,
  sourceProofPacket:c.sourceProofPacket,
  clientCertFingerprint:c.sourceClientFingerprint,
  expectedChallengeDigest:c.expectedChallengeDigest,
  expectedRevision:c.sourceRevision,tenantId:c.tenantId});
 const enrollment=link.review();
 if(enrollment.state!=='SUPERVISED_PRIVATE_YW_ENROLLMENT_REVIEW_HELD')
  HOLD('CURRENT_SIGNED_QL483_ENROLLMENT_REQUIRED');
 const reader=createQl482ProtectedCaseReader({adapter,operatorPin:c.operatorPin,
  acl:{[c.operatorClientFingerprint]:{operatorId:c.operatorId,
   role:'case-reader',scopes:[{sourceApp:'yard-workers',
    environment:'PRIVATE_STAGING',tenantId:c.tenantId}]}}});
 const fieldReview=createQl484SupervisedYwFieldReview({directory:sessionDirectory,
  link,adapter,reader,sourcePin:c.sourcePin,operatorPin:c.operatorPin,
  ownerHostPin:c.ownerHostPin,reviewerPin:c.reviewerPin,
  originalHostId:c.originalHostId,expectedSourceRevision:c.sourceRevision,
  expectedCommsMainRevision:c.commsMainRevision,
  sourceClientFingerprint:c.sourceClientFingerprint,
  operatorClientFingerprint:c.operatorClientFingerprint,
  expectedOwnerChallengeDigest:c.expectedOwnerChallengeDigest});
 const tlsOptions={ca:readFileSync(ownerPath(c.serverCaPath)),
  cert:readFileSync(ownerPath(c.serverCertPath)),
  key:readFileSync(ownerPath(c.serverKeyPath))};
 const server=createQl484PrivateReviewHttpsServer({tlsOptions,fieldReview});
 server.on('request',(_req,res)=>res.once('finish',()=>{
  if(res.statusCode===200)server.close();
 }));
 const timeout=setTimeout(()=>server.close(),90000);timeout.unref();
 process.once('SIGINT',()=>server.close());
 await new Promise((resolveStart,rejectStart)=>{
  server.once('error',rejectStart);
  server.listen(8843,'127.0.0.1',resolveStart);
 });
 process.stdout.write(JSON.stringify({
  state:'SUPERVISED_PRIVATE_YW_WITNESS_LOOPBACK_STARTED',
  bindAddress:'127.0.0.1',port:8843,maxSeconds:90,
  privateSourceJournalExpected:true,providerSend:false,
  originalHostVerified:false,fieldAcceptance:'HOLD',
  automaticActivation:false})+'\n');
 await new Promise((resolveEnd,rejectEnd)=>{
  server.once('close',resolveEnd);server.once('error',rejectEnd);
 });
}
run().catch(e=>{process.stderr.write(JSON.stringify({
 state:'HOLD',reason:String(e.message).startsWith('HOLD_QL484_')?e.message:
 'HOLD_QL484_PRIVATE_SUPERVISED_RUNTIME_UNAVAILABLE'})+'\n');process.exitCode=1});
