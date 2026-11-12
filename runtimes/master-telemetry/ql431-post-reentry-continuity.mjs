import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readdirSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,renameSync,unlinkSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const MAX_AGE=60000;
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(p,keys)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===keys.length&&keys.every(k=>Object.hasOwn(p,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hold=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,connection:'HOLD',receiver,ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'
});
const recent=(s,nowMs)=>typeof s==='string'&&Number.isSafeInteger(nowMs)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=nowMs&&nowMs-Date.parse(s)<=MAX_AGE;
function signed(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeOf=a=>({ceremonyId:a?.ceremonyId,sourceId:a?.sourceId,episodeId:a?.episodeId,
 sourceRevision:a?.sourceRevision,controllerRevision:a?.controllerRevision});
const scopeValid=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&s.sourceId==='rosevear-ai-hub'&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
const emptySequences=()=>Object.fromEntries(MASTERS.map(m=>[m,0]));
const seqValid=s=>exact(s,MASTERS)&&MASTERS.every(m=>Number.isSafeInteger(s[m])&&s[m]>=0);
const entryKeys=['kind','scope','observationId','observedAt','ql430AcceptedDigest',
 'evidenceDigest','sequences','incidentId','shutdownAckDigest','receiverOffDigest',
 'reportsDigest','ownerDecisionDigest'];
function validEntry(e){
 if(!exact(e,entryKeys)||!['HEALTH','PENDING','OFF','RECONCILED'].includes(e.kind)||
  !scopeValid(e.scope)||!ID.test(e.observationId??'')||
  !recent(e.observedAt,Date.parse(e.observedAt))||
  !HEX.test(e.ql430AcceptedDigest??'')||!HEX.test(e.evidenceDigest??'')||
  !seqValid(e.sequences))return false;
 if(e.kind==='HEALTH')
  return MASTERS.every(m=>e.sequences[m]>0)&&
   ['incidentId','shutdownAckDigest','receiverOffDigest','reportsDigest','ownerDecisionDigest'].every(k=>e[k]===null);
 if(!ID.test(e.incidentId??''))return false;
 if(e.kind==='PENDING')return ['shutdownAckDigest','receiverOffDigest','reportsDigest','ownerDecisionDigest'].every(k=>e[k]===null);
 if(!HEX.test(e.shutdownAckDigest??'')||!HEX.test(e.receiverOffDigest??''))return false;
 return e.kind==='OFF'?
  e.reportsDigest===null&&e.ownerDecisionDigest===null:
  HEX.test(e.reportsDigest??'')&&HEX.test(e.ownerDecisionDigest??'');
}
function transition(prior,next){
 if(!prior)return next.kind==='HEALTH'||next.kind==='PENDING';
 const a=prior.entry,b=next;
 if(!same(a.scope,b.scope)||a.ql430AcceptedDigest!==b.ql430AcceptedDigest||
  Date.parse(b.observedAt)<Date.parse(a.observedAt))return false;
 if(a.kind==='HEALTH'){
  if(b.kind==='HEALTH')return MASTERS.every(m=>b.sequences[m]>a.sequences[m])&&
   a.observationId!==b.observationId;
  return b.kind==='PENDING'&&same(a.sequences,b.sequences)&&a.observationId!==b.observationId;
 }
 if(a.kind==='PENDING')return b.kind==='OFF'&&
  b.observationId===a.observationId&&b.incidentId===a.incidentId&&
  same(b.sequences,a.sequences);
 if(a.kind==='OFF')return b.kind==='RECONCILED'&&
  b.observationId===a.observationId&&b.incidentId===a.incidentId&&
  same(b.sequences,a.sequences)&&b.shutdownAckDigest===a.shutdownAckDigest&&
  b.receiverOffDigest===a.receiverOffDigest;
 return false;
}
/** Private, immutable per-observation evidence chain. The separate signed original-host
 * acceptance and off-host witness are still necessary: a privileged user can delete
 * the entire local directory, which this ledger alone cannot detect. */
export function openQl431ProtectedContinuityStore(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('UNSAFE_QL431_LEDGER_DIRECTORY');
 const paths=scope=>{
  if(!scopeValid(scope))throw Error('INVALID_QL431_SCOPE');
  const prefix=hash(scope);
  return {prefix,head:join(root,prefix+'.head'),lock:join(root,prefix+'.lock'),
   record:i=>join(root,prefix+'-'+String(i).padStart(8,'0')+'.json')};
 };
 const read=scope=>{
  const f=paths(scope);
  const present=readdirSync(root).filter(n=>new RegExp('^'+f.prefix+'-[0-9]{8}\\.json$').test(n));
  let raw;
  try{raw=readFileSync(f.head,'utf8');}
  catch(e){if(e.code==='ENOENT'&&present.length===0)return null;throw Error('QL431_HEAD_MISSING');}
  if(raw.length>1024)throw Error('QL431_HEAD_OVERSIZE');
  let head;
  try{head=JSON.parse(raw);}catch{throw Error('QL431_HEAD_CORRUPT');}
  if(!exact(head,['schema','count','lastDigest'])||head.schema!=='rosevear.ql431.head.v1'||
   !Number.isSafeInteger(head.count)||head.count<1||head.count>999999||
   !HEX.test(head.lastDigest??'')||present.length!==head.count)
   throw Error('QL431_HEAD_TAMPERED');
  let last=null;
  for(let i=1;i<=head.count;i++){
   let s;
   try{s=readFileSync(f.record(i),'utf8');}catch{throw Error('QL431_CHAIN_GAP');}
   if(s.length>4096)throw Error('QL431_RECORD_OVERSIZE');
   let rec;
   try{rec=JSON.parse(s);}catch{throw Error('QL431_RECORD_CORRUPT');}
   if(!exact(rec,['schema','index','previousDigest','entry','recordDigest'])||
    rec.schema!=='rosevear.ql431.continuity-receipt.v1'||rec.index!==i||
    rec.previousDigest!==(last?.recordDigest??null)||!validEntry(rec.entry)||
    !same(rec.entry.scope,scope)||!transition(last,rec.entry)||
    rec.recordDigest!==hash({schema:rec.schema,index:rec.index,
     previousDigest:rec.previousDigest,entry:rec.entry}))
    throw Error('QL431_CHAIN_TAMPERED');
   last=rec;
  }
  if(last?.recordDigest!==head.lastDigest)throw Error('QL431_HEAD_DIGEST_TAMPERED');
  return last;
 };
 const append=(scope,entry,expectedDigest)=>{
  if(!scopeValid(scope)||!validEntry(entry)||!same(scope,entry.scope))
   throw Error('INVALID_QL431_ENTRY');
  const f=paths(scope);
  const lock=openSync(f.lock,'wx',0o600);
  try{
   const prior=read(scope);
   if((prior?.recordDigest??null)!==expectedDigest||!transition(prior,entry))
    throw Error('QL431_REPLAY_OR_INVALID_TRANSITION');
   const rec={schema:'rosevear.ql431.continuity-receipt.v1',
    index:(prior?.index??0)+1,previousDigest:prior?.recordDigest??null,entry};
   rec.recordDigest=hash(rec);
   const rf=openSync(f.record(rec.index),'wx',0o600);
   try{writeFileSync(rf,JSON.stringify(rec));fsyncSync(rf);}finally{closeSync(rf);}
   const tmp=join(root,f.prefix+'.head.'+rec.recordDigest.slice(0,12)+'.tmp');
   const tf=openSync(tmp,'wx',0o600);
   try{writeFileSync(tf,JSON.stringify({schema:'rosevear.ql431.head.v1',
    count:rec.index,lastDigest:rec.recordDigest}));fsyncSync(tf);}finally{closeSync(tf);}
   renameSync(tmp,f.head);
   const df=openSync(root,'r');try{fsyncSync(df);}finally{closeSync(df);}
   if(read(scope)?.recordDigest!==rec.recordDigest)throw Error('QL431_DURABLE_READBACK_FAILED');
   return rec;
  }finally{closeSync(lock);unlinkSync(f.lock);}
 };
 return Object.freeze({read,append});
}
function acceptedQl430(accepted,audit){
 const scope=scopeOf(accepted);
 if(!scopeValid(scope)||accepted?.state!=='DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT'||
  accepted.connection!=='VERIFIED_CONNECTED_PILOT'||accepted.receiver!=='ISOLATED_ONE_TEST_ON'||
  accepted.ownerAcceptance!=='DUAL_SIGNED_FOR_ISOLATED_PILOT'||
  accepted.masterCount!==3||accepted.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  !HEX.test(accepted.acceptedRecordDigest??'')||!HEX.test(accepted.ql429WitnessDigest??'')||
  !HEX.test(accepted.independentReceiverDigest??'')||typeof audit?.read!=='function')
  return null;
 try{
  const record=audit.read('accepted',scope.ceremonyId);
  return record?.kind==='accepted'&&record.ceremonyId===scope.ceremonyId&&
   record.recordDigest===accepted.acceptedRecordDigest?scope:null;
 }catch{return null;}
}
function heartbeatEvidence(heartbeats,scope,acceptanceDigest,pins,previous,nowMs){
 if(!Array.isArray(heartbeats)||heartbeats.length!==3||!pins)return null;
 const seen=new Set(),payloads=[];
 for(const envelope of heartbeats){
  const p=envelope?.payload;
  if(!exact(envelope,['payload','signature'])||
   !exact(p,['schema','masterId','scope','ql430AcceptedDigest','status','sequence','observedAt'])||
   p.schema!=='rosevear.ql431.master-post-reentry-health.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||!same(p.scope,scope)||
   p.ql430AcceptedDigest!==acceptanceDigest||p.status!=='ISOLATED_PILOT_HEALTHY'||
   !Number.isSafeInteger(p.sequence)||p.sequence<1||
   p.sequence<=(previous[p.masterId]??0)||!recent(p.observedAt,nowMs)||
   !signed(p,envelope.signature,pins[p.masterId]))return null;
  seen.add(p.masterId);payloads.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 payloads.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {digest:hash(payloads),sequences:Object.fromEntries(payloads.map(p=>[p.masterId,p.sequence]))};
}
function observedReceiver(envelope,schema,scope,acceptanceDigest,observationId,
 incidentId,ackDigest,state,pin,nowMs,minimumMs=0){
 const p=envelope?.payload;
 return exact(envelope,['payload','signature'])&&
  exact(p,['schema','scope','ql430AcceptedDigest','observationId','incidentId',
   'shutdownAckDigest','receiverState','observedAt'])&&
  p.schema===schema&&same(p.scope,scope)&&
  p.ql430AcceptedDigest===acceptanceDigest&&p.observationId===observationId&&
  p.incidentId===incidentId&&p.shutdownAckDigest===ackDigest&&
  p.receiverState===state&&recent(p.observedAt,nowMs)&&
  Date.parse(p.observedAt)>=minimumMs&&signed(p,envelope.signature,pin);
}
function baseEntry(kind,scope,observationId,nowMs,acceptedDigest,previousSequences){
 return {kind,scope,observationId,observedAt:new Date(nowMs).toISOString(),
  ql430AcceptedDigest:acceptedDigest,evidenceDigest:hash({kind,observationId,scope}),
  sequences:previousSequences,incidentId:null,shutdownAckDigest:null,
  receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
}
async function failClosed({receiverAdapter,independentReceiverAdapter,store,scope,
 observationId,incidentId,acceptedDigest,sequences,prior,reason},{
 shutdownPin,independentReceiverPin,independentShutdownPinVerified,
 independentReceiverPinVerified,nowMs
}){
 let pending;
 const entry=baseEntry('PENDING',scope,observationId,nowMs,acceptedDigest,sequences);
 entry.incidentId=incidentId;
 entry.evidenceDigest=hash({reason,observationId,scope,incidentId});
 try{pending=store.append(scope,entry,prior?.recordDigest??null);}
 catch{pending=null;}
 let ack;
 try{ack=await receiverAdapter.disableOneTest({ceremonyId:scope.ceremonyId,
  observationId,incidentId,reason});}
 catch{return hold('FAIL_CLOSED_DISABLE_THREW_MANUAL_RECOVERY_REQUIRED');}
 if(ack?.disabled!==true)
  return hold('FAIL_CLOSED_DISABLE_NOT_CONFIRMED');
 const ap=ack?.signedAck?.payload;
 if(!independentShutdownPinVerified||
  !exact(ack.signedAck,['payload','signature'])||
  !exact(ap,['schema','scope','observationId','incidentId','reason','receiverState','disabledAt'])||
  ap.schema!=='rosevear.ql431.signed-fail-closed-shutdown.v1'||
  !same(ap.scope,scope)||ap.observationId!==observationId||
  ap.incidentId!==incidentId||ap.reason!==reason||ap.receiverState!=='OFF'||
  !recent(ap.disabledAt,nowMs)||!signed(ap,ack.signedAck.signature,shutdownPin))
  return hold('SIGNED_RECEIVER_SHUTDOWN_ACK_NOT_VERIFIED');
 let off;
 try{off=await independentReceiverAdapter.readSignedState({
  ceremonyId:scope.ceremonyId,observationId,incidentId,
  shutdownAckDigest:hash(ap),requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_OFF_READBACK_UNAVAILABLE');}
 if(!independentReceiverPinVerified||!observedReceiver(off,
  'rosevear.ql431.independent-receiver-health.v1',scope,acceptedDigest,
  observationId,incidentId,hash(ap),'OFF',independentReceiverPin,
  nowMs,Date.parse(ap.disabledAt)))
  return hold('FRESH_INDEPENDENT_SIGNED_OFF_NOT_VERIFIED');
 if(!pending)return hold('OFF_SIGNED_BUT_PENDING_INCIDENT_CUSTODY_MISSING',
  'OFF_SIGNED_BUT_NOT_DURABLY_RECORDED');
 const done={...entry,kind:'OFF',shutdownAckDigest:hash(ap),
  receiverOffDigest:hash(off.payload),observedAt:new Date(nowMs).toISOString()};
 try{
  const saved=store.append(scope,done,pending.recordDigest);
  return {...hold('PILOT_SHUT_DOWN_AWAITING_THREE_MASTER_INCIDENT_CUSTODY',
   'OFF_VERIFIED_SIGNED_READBACK'),state:'DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN',
   scope,incidentId,shutdownCheckpointDigest:saved.recordDigest,
   checkpointIndex:saved.index};
 }catch{return hold('SIGNED_OFF_VERIFIED_BUT_CUSTODY_COMMIT_FAILED',
  'OFF_SIGNED_BUT_NOT_DURABLY_RECORDED');}
}
/** A bounded single cycle, never an automated scheduler, uptime claim or general CONNECTED.
 * A missing/stale signed health report, signed ON readback or durable health write
 * requests fail-closed shutdown. Only signed independent OFF proves shutdown.
 * No real receiver or signing keys are shipped in this repository. */
export async function runQl431PostReentryPilotHealth({
 ql430Acceptance,ql430Audit,heartbeats,independentReceiverAdapter,
 receiverAdapter,store,observationId,incidentId
},{
 nowMs,masterPins,independentReceiverPin,shutdownPin,
 originalHostSessionVerified=false,independentQl430AcceptanceVerified=false,
 independentMasterPinsVerified=false,independentReceiverPinVerified=false,
 independentShutdownPinVerified=false
}={}){
 const scope=acceptedQl430(ql430Acceptance,ql430Audit);
 if(!originalHostSessionVerified||!independentQl430AcceptanceVerified||!scope||
  !Number.isSafeInteger(nowMs)||!ID.test(observationId??'')||!ID.test(incidentId??'')||
  observationId===incidentId||typeof store?.read!=='function'||
  typeof store?.append!=='function'||typeof receiverAdapter?.disableOneTest!=='function'||
  typeof independentReceiverAdapter?.readSignedState!=='function')
  return hold('PROTECTED_QL430_ORIGINAL_HOST_MONITOR_AUTHORITY_REQUIRED');
 let prior;
 try{prior=store.read(scope);}
 catch{return hold('PROTECTED_QL431_LEDGER_UNREADABLE');}
 if(prior&&['PENDING','OFF','RECONCILED'].includes(prior.entry.kind))
  return hold('PILOT_TERMINAL_INCIDENT_NEW_CEREMONY_REQUIRED',
   prior.entry.kind==='PENDING'?'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED':'OFF_PENDING_REVALIDATION');
 if(prior?.entry.observationId===observationId)
  return hold('REPLAYED_PILOT_OBSERVATION');
 const sequences=prior?.entry.sequences??emptySequences();
 const trustedPins=independentMasterPinsVerified&&independentReceiverPinVerified&&
  independentShutdownPinVerified&&
  typeof shutdownPin==='string'&&typeof independentReceiverPin==='string'&&
  shutdownPin!==independentReceiverPin&&masterPins&&
  MASTERS.every(m=>typeof masterPins[m]==='string'&&
   masterPins[m]!==independentReceiverPin&&masterPins[m]!==shutdownPin);
 const acceptedDigest=ql430Acceptance.acceptedRecordDigest;
 let evidence=trustedPins?heartbeatEvidence(heartbeats,scope,acceptedDigest,
  masterPins,sequences,nowMs):null;
 let receiverProof=null;
 if(evidence){
  try{receiverProof=await independentReceiverAdapter.readSignedState({
   ceremonyId:scope.ceremonyId,observationId,requiredState:'ISOLATED_ONE_TEST_ON'});}
  catch{receiverProof=null;}
 }
 if(evidence&&!observedReceiver(receiverProof,
  'rosevear.ql431.independent-receiver-health.v1',scope,acceptedDigest,
  observationId,null,null,'ISOLATED_ONE_TEST_ON',independentReceiverPin,nowMs))
  evidence=null;
 if(evidence){
  const entry=baseEntry('HEALTH',scope,observationId,nowMs,acceptedDigest,evidence.sequences);
  entry.evidenceDigest=hash({masterReportsDigest:evidence.digest,
   independentReceiverDigest:hash(receiverProof.payload)});
  try{
   const saved=store.append(scope,entry,prior?.recordDigest??null);
   return {state:'DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT',
    connection:'VERIFIED_CONNECTED_PILOT',receiver:'ISOLATED_ONE_TEST_ON',
    ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',
    runtimeUptime:'SIGNED_SINGLE_CYCLE_NOT_MEASURED_UPTIME',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',scope,
    checkpointIndex:saved.index,checkpointDigest:saved.recordDigest,
    observedAt:entry.observedAt,sequences:entry.sequences};
  }catch{/* A failed durable write is never a healthy result. */}
 }
 return failClosed({receiverAdapter,independentReceiverAdapter,store,scope,
  observationId,incidentId,acceptedDigest,sequences,prior,
  reason:evidence?'DURABLE_HEALTH_CUSTODY_WRITE_FAILED':'SIGNED_POST_REENTRY_HEALTH_REJECTED'},{
  nowMs,shutdownPin,independentReceiverPin,
  independentShutdownPinVerified,independentReceiverPinVerified});
}
/** A separate three-Master plus dual-owner incident reconciliation after signed OFF.
 * This records custody only; NEVER reactivates a pilot or clears HOLD. */
export function reconcileQl431ThreeMasterIncident({
 store,scope,incidentId,reports,ownerAcceptance
},{
 nowMs,masterPins,ownerPin,reviewerPin,
 protectedOperatorSession=false,independentMasterPinsVerified=false,
 independentOwnerCustodyVerified=false,independentReviewerCustodyVerified=false
}={}){
 if(!protectedOperatorSession||!independentMasterPinsVerified||
  !independentOwnerCustodyVerified||!independentReviewerCustodyVerified||
  !Number.isSafeInteger(nowMs)||!scopeValid(scope)||!ID.test(incidentId??'')||
  ownerPin===reviewerPin||!masterPins||
  typeof store?.read!=='function'||typeof store?.append!=='function')
  return hold('THREE_MASTER_INCIDENT_RECONCILIATION_AUTHORITY_REQUIRED');
 let previous;
 try{previous=store.read(scope);}catch{return hold('INCIDENT_CUSTODY_UNREADABLE');}
 if(previous?.entry?.kind!=='OFF'||previous.entry.incidentId!==incidentId)
  return hold('DURABLE_INDEPENDENT_SIGNED_SHUTDOWN_REQUIRED');
 const e=previous.entry;
 if(!Array.isArray(reports)||reports.length!==3)return hold('THREE_MASTER_INCIDENT_REPORTS_MISSING');
 const seen=new Set(),payloads=[];
 for(const r of reports){
  const p=r?.payload;
  if(!exact(r,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId','shutdownRecordDigest',
    'receiverOffDigest','status','observedAt'])||
   p.schema!=='rosevear.ql431.master-incident-custody.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !same(p.scope,scope)||p.incidentId!==incidentId||
   p.shutdownRecordDigest!==previous.recordDigest||
   p.receiverOffDigest!==e.receiverOffDigest||
   p.status!=='ISOLATED_RECEIVER_OFF_INCIDENT_HELD'||
   !recent(p.observedAt,nowMs)||Date.parse(p.observedAt)<Date.parse(e.observedAt)||
   !signed(p,r.signature,masterPins[p.masterId]))
   return hold('THREE_MASTER_SIGNED_INCIDENT_CUSTODY_REJECTED',
    'OFF_VERIFIED_SIGNED_READBACK');
  seen.add(p.masterId);payloads.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return hold('THREE_MASTER_INCIDENT_REPORTS_INCOMPLETE');
 payloads.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportDigest=hash(payloads),p=ownerAcceptance?.payload;
 if(!exact(ownerAcceptance,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','scope','incidentId','shutdownRecordDigest','reportsDigest',
   'action','ownerId','reviewerId','acceptedAt'])||
  p.schema!=='rosevear.ql431.owner-incident-reconciliation.v1'||
  !same(p.scope,scope)||p.incidentId!==incidentId||
  p.shutdownRecordDigest!==previous.recordDigest||p.reportsDigest!==reportDigest||
  p.action!=='ACKNOWLEDGE_FAIL_CLOSED_INCIDENT_KEEP_RECEIVER_OFF'||
  !PERSON.test(p.ownerId??'')||!PERSON.test(p.reviewerId??'')||
  p.ownerId===p.reviewerId||!recent(p.acceptedAt,nowMs)||
  Date.parse(p.acceptedAt)<Math.max(...payloads.map(x=>Date.parse(x.observedAt)))||
  !signed(p,ownerAcceptance.ownerSignature,ownerPin)||
  !signed(p,ownerAcceptance.reviewerSignature,reviewerPin))
  return hold('DUAL_SIGNED_OWNER_INCIDENT_DECISION_REJECTED','OFF_VERIFIED_SIGNED_READBACK');
 const entry={...e,kind:'RECONCILED',observedAt:new Date(nowMs).toISOString(),
  reportsDigest:reportDigest,ownerDecisionDigest:hash(p)};
 try{
  const record=store.append(scope,entry,previous.recordDigest);
  return {...hold('INCIDENT_RECONCILED_RECEIVER_MUST_REMAIN_OFF',
   'OFF_VERIFIED_SIGNED_READBACK'),
   state:'DURABLE_QL431_THREE_MASTER_INCIDENT_RECONCILED',
   scope,incidentId,masterCount:3,reconciliationDigest:record.recordDigest,
   checkpointIndex:record.index,ownerAcceptance:'DUAL_SIGNED_INCIDENT_CUSTODY_ONLY'};
 }catch{return hold('INCIDENT_CUSTODY_COMMIT_OR_REPLAY_FAILED',
  'OFF_VERIFIED_SIGNED_READBACK');}
}
