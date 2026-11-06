/** QL-342A isolated loopback drill. Never starts the real Comms receiver. */
import {createHash,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createConnection} from 'node:net';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {restrictDirectory} from './owner-authority-custody.mjs';

export const QL342A_DRILL_SCHEMA='rosevear.hub.ql342a.inert-rollback-drill.v1';
const childPath=fileURLToPath(new URL('./ql342a-inert-child.mjs',import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const hold=state=>({state,validDrillDocument:false,originalReceiverStopped:false,
  originalFieldWitnessApproved:false,connected:false});

/** Structural check of an operator-held document is NOT independent witness. */
export function inspectInertDrillDocument(record,{expectedComputer,now=Date.now()}={}){
  if(!record||typeof record!=='object'||Array.isArray(record)||
    record.schema!==QL342A_DRILL_SCHEMA||
    record.state!=='INERT_LOOPBACK_PROCESS_STOPPED_OWNER_REVIEW_REQUIRED'||
    record.loopbackAddress!=='127.0.0.1'||
    !Number.isSafeInteger(record.loopbackPort)||
    record.loopbackPort<=1024||record.loopbackPort===8788||record.loopbackPort>65535||
    !Number.isSafeInteger(record.stoppedInertPid)||record.stoppedInertPid<=0||
    !/^[a-f0-9]{64}$/.test(record.inertChildSha256??'')||
    !/^[a-f0-9]{64}$/.test(record.challengeSha256??'')||
    record.exactInertChallengeVerified!==true||record.inertProcessExitObserved!==true||
    record.loopbackPortClosedAfterStop!==true||
    record.originalReceiverStopped!==false||record.originalReceiverPortUsed!==false||
    record.databaseCredentialsRead!==false||record.originalOwnerSignaturesCreated!==false||
    record.databaseEnrollmentCreated!==false||record.customerCommunications!==false||
    record.deviceActions!==false||record.connected!==false||
    typeof record.computer!=='string'||record.computer.length>80||
    (expectedComputer&&record.computer!==expectedComputer))
    return hold('DENY_UNREVIEWED_OR_ELEVATED_ROLLBACK_DRILL_DOCUMENT');
  const start=Date.parse(record.startedAt??''),end=Date.parse(record.stoppedAt??'');
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>end||
    end-start>20_000||end>now+30_000||start<0)
    return hold('DENY_INVALID_INERT_ROLLBACK_DRILL_TIMESTAMPS');
  return {state:'INERT_ROLLBACK_DRILL_DOCUMENT_FORMAT_VALID_NOT_INDEPENDENT_WITNESS',
    validDrillDocument:true,originalReceiverStopped:false,
    originalFieldWitnessApproved:false,connected:false,
    stoppedInertPid:record.stoppedInertPid,loopbackPort:record.loopbackPort,
    independentHumanReviewRequired:true};
}

const waitReady=(child,timeoutMs)=>new Promise((resolveReady,reject)=>{
  let buffer='';
  const timeout=setTimeout(()=>reject(Error('HOLD_INERT_CHILD_READY_TIMEOUT')),timeoutMs);
  child.stdout.on('data',chunk=>{
    buffer+=chunk.toString();
    if(buffer.length>4096){clearTimeout(timeout);reject(Error('DENY_OVERSIZE_CHILD_READBACK'));return;}
    if(buffer.includes('\n')){
      clearTimeout(timeout);
      try{resolveReady(JSON.parse(buffer.split('\n')[0]));}
      catch{reject(Error('DENY_INERT_CHILD_READBACK_SCHEMA'));}
    }
  });
  child.on('error',reject);
  child.on('exit',()=>reject(Error('HOLD_INERT_CHILD_EXITED_BEFORE_READY')));
});

const readLocalChallenge=(port,digest)=>new Promise((resolveChallenge,reject)=>{
  const socket=createConnection({host:'127.0.0.1',port});
  let reply='';
  socket.setTimeout(2500,()=>socket.destroy(Error('HOLD_INERT_CHALLENGE_TIMEOUT')));
  socket.on('data',part=>{reply+=part.toString();if(reply.length>200)socket.destroy(Error('DENY_OVERSIZE_INERT_REPLY'));});
  socket.on('end',()=>reply===`QL342A_INERT_LOOPBACK_ONLY:${digest}\n`
    ?resolveChallenge(true):reject(Error('DENY_INERT_CHALLENGE_MISMATCH')));
  socket.on('error',reject);
});

const localPortIsClosed=port=>new Promise((resolveClosed,reject)=>{
  const socket=createConnection({host:'127.0.0.1',port});
  socket.setTimeout(2500,()=>socket.destroy(Error('HOLD_PORT_CLOSURE_TIMEOUT')));
  socket.once('connect',()=>{socket.destroy();resolveClosed(false);});
  socket.once('error',error=>error.code==='ECONNREFUSED'
    ?resolveClosed(true):reject(error));
});

const waitForOwnChildExit=(child,timeoutMs)=>new Promise(resolveExit=>{
  if(child.exitCode!==null||child.signalCode!==null){resolveExit(true);return;}
  const timeout=setTimeout(()=>{child.off('exit',onExit);resolveExit(false);},timeoutMs);
  const onExit=()=>{clearTimeout(timeout);resolveExit(true);};
  child.once('exit',onExit);
});

const stopOwnChild=async child=>{
  // An unexpected earlier exit is NOT evidence of the parent's shutdown action.
  if(child.exitCode!==null||child.signalCode!==null)return false;
  const stopPromise=waitForOwnChildExit(child,3000);
  if(!child.kill('SIGTERM'))return false;
  if(await stopPromise)return true;
  const forced=waitForOwnChildExit(child,2000);
  child.kill('SIGKILL');
  return forced;
};

/** Synthetic drill can run in CI or by an owner. Only the CLI requires Ree's
 * physical Windows host and typed consent; this cannot stop another process. */
export async function runInertLoopbackDrill({computer='SYNTHETIC_TEST_RUNNER',
  now=()=>Date.now()}={}){
  const token=randomBytes(24).toString('hex');
  const tokenDigest=sha(token);
  const child=spawn(process.execPath,[childPath,'--inert-loopback-child'],{
    stdio:['ignore','pipe','pipe'],windowsHide:true,
    env:{PATH:process.env.PATH??'',SystemRoot:process.env.SystemRoot??'',
      TEMP:process.env.TEMP??'',QL342A_DRILL_TOKEN:token}});
  let ready,challenge=false,stopped=false,closed=false;
  const startedAt=new Date(now()).toISOString();
  try{
    ready=await waitReady(child,6000);
    if(ready.schema!=='rosevear.hub.ql342a.inert-child.v1'||ready.pid!==child.pid||
      ready.address!=='127.0.0.1'||!Number.isSafeInteger(ready.port)||
      ready.port<=1024||ready.port===8788||ready.port>65535||
      ready.tokenDigest!==tokenDigest)
      throw Error('DENY_INERT_CHILD_IDENTITY_OR_PORT');
    challenge=await readLocalChallenge(ready.port,tokenDigest);
    stopped=await stopOwnChild(child);
    if(!stopped)throw Error('HOLD_INERT_CHILD_STOP_NOT_VERIFIED');
    closed=await localPortIsClosed(ready.port);
    if(!closed)throw Error('HOLD_INERT_LOOPBACK_PORT_STILL_LISTENING');
  }finally{
    if(!stopped)await stopOwnChild(child);
  }
  const record={schema:QL342A_DRILL_SCHEMA,
    state:'INERT_LOOPBACK_PROCESS_STOPPED_OWNER_REVIEW_REQUIRED',
    computer,startedAt,stoppedAt:new Date(now()).toISOString(),
    stoppedInertPid:ready.pid,loopbackAddress:'127.0.0.1',loopbackPort:ready.port,
    challengeSha256:tokenDigest,inertChildSha256:sha(readFileSync(childPath)),
    exactInertChallengeVerified:challenge,inertProcessExitObserved:stopped,
    loopbackPortClosedAfterStop:closed,
    originalReceiverStopped:false,originalReceiverPortUsed:false,
    databaseCredentialsRead:false,originalOwnerSignaturesCreated:false,
    databaseEnrollmentCreated:false,customerCommunications:false,
    deviceActions:false,connected:false,
    independentOriginalOwnerFieldWitnessRequired:true};
  if(!inspectInertDrillDocument(record,{expectedComputer:computer,now:now()}).validDrillDocument)
    throw Error('DENY_INERT_DRILL_RECORD_FAILED_LOCAL_CONSISTENCY');
  return record;
}

const promptExactConsent=async()=>{
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_OWNER_INTERACTIVE_TTY_REQUIRED');
  const prompt=createInterface({input:process.stdin,output:process.stdout});
  try{
    const answer=await prompt.question('Type RUN_INERT_LOOPBACK_DRILL to start and stop a harmless LOCAL TEST process: ');
    if(answer!=='RUN_INERT_LOOPBACK_DRILL')throw Error('HOLD_OWNER_DRILL_CONSENT_NOT_GIVEN');
  }finally{prompt.close();}
};

export async function ql342aCli(args=process.argv.slice(2),env=process.env){
  if(args.length===1&&args[0]==='--help')return {schema:'rosevear.hub.ql342a.cli.v1',
    commands:['--run','--inspect OWNER_DRILL_JSON'],
    originalReceiverStarted:false,customerCommunications:false,deviceActions:false};
  if(args.length===2&&args[0]==='--inspect')
    return inspectInertDrillDocument(JSON.parse(readFileSync(resolve(args[1]),'utf8')),
      {expectedComputer:'DESKTOP-AE894KC'});
  if(args.length!==1||args[0]!=='--run')throw Error('DENY_UNSUPERVISED_ROLLBACK_ACTION');
  if(process.platform!=='win32'||env.COMPUTERNAME!=='DESKTOP-AE894KC'||
    !env.LOCALAPPDATA||env.DATABASE_URL)
    throw Error('HOLD_ORIGINAL_WINDOWS_OWNER_AND_NO_DATABASE_CREDENTIAL_REQUIRED');
  const evidence=join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay','Evidence');
  if(!existsSync(evidence))throw Error('HOLD_ORIGINAL_PRIVATE_EVIDENCE_DIRECTORY_MISSING');
  await promptExactConsent();
  const record=await runInertLoopbackDrill({computer:env.COMPUTERNAME});
  restrictDirectory(evidence);
  const target=join(evidence,'ql342a-inert-rollback-drill-'+new Date()
    .toISOString().replace(/[:.]/g,'-')+'.json');
  writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx',mode:0o600});
  return {schema:QL342A_DRILL_SCHEMA,
    state:'INERT_DRILL_STOP_VERIFIED_INDEPENDENT_ORIGINAL_OWNER_REVIEW_REQUIRED',
    evidencePath:target,loopbackPortClosedAfterStop:true,
    originalReceiverStopped:false,receiverActivated:false,
    databaseEnrollmentCreated:false,connected:false,customerCommunications:false,deviceActions:false};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql342aCli())+'\n');}
  catch{process.stderr.write('HOLD_QL342A_SUPERVISED_INERT_ROLLBACK_NOT_VERIFIED\n');process.exitCode=1;}
}
