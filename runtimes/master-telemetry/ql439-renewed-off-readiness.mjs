import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const LEASE_EXCEPTIONS=['LATE_HOST_SHUTDOWN_ESCALATION','LATE_INDEPENDENT_OFF_READBACK_ESCALATION'];
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>Number.isSafeInteger(now)&&iso(s)&&Date.parse(s)<=now&&
 now-Date.parse(s)<=60000;
const hold=(reason)=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'UNKNOWN_UNTIL_FRESH_INDEPENDENT_OFF_REVALIDATION',
 activationAuthorized:false,ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',
 manualReceiverIsolationRequired:true,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function validSig(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const key=createPublicKey({key:der,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,
   Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeOk=s=>exact(s,['ceremonyId','sourceId','episodeId',
 'sourceRevision','controllerRevision'])&&s.sourceId==='rosevear-ai-hub'&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
function verifiedPredecessors({
 ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
 ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store
}){
 const h=ql438Closure,g=ql437Exception,f=ql436Review,e=ql435Decision,
  d=ql434Readiness,c=ql433Precheck,b=ql432Decision,s=d?.scope;
 if(!scopeOk(s)||
  h?.state!=='DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK'||
  h.connection!=='HOLD'||h.activationAuthorized!==false||
  h.receiver!=='OFF_VERIFIED_SIGNED_REMEDIATION_WITNESS'||
  h.ownerAcceptance!=='DUAL_SIGNED_CORRECTIVE_EVIDENCE_EXCEPTION_CLOSURE_ONLY'||
  h.leaseExceptionOpen!==false||h.incidentClosed!==true||
  h.masterCount!==3||
  h.permittedNextAction!=='NEW_SEPARATELY_AUTHORIZED_SUPERVISED_CEREMONY_NO_AUTOMATIC_REENTRY'||
  !ID.test(h.originalIncidentId??'')||!ID.test(h.nextCeremonyId??'')||
  !ID.test(h.remediationId??'')||!LEASE_EXCEPTIONS.includes(h.leaseDisposition)||
  !HEX.test(h.priorQl437ExternalAnchorDigest??'')||
  !HEX.test(h.remediationAnchorDigest??'')||
  !HEX.test(h.independentAnchorReadbackDigest??'')||
  !HEX.test(h.pendingReceiptDigest??'')||
  !HEX.test(h.closedReceiptDigest??'')||
  g?.state!=='DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY'||
  g.connection!=='HOLD'||g.activationAuthorized!==false||
  g.incidentClosed!==false||g.leaseExceptionOpen!==true||
  g.ownerAcceptance!=='DUAL_SIGNED_LEASE_EXCEPTION_OPEN'||
  g.receiver!=='OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS'||
  g.masterCount!==3||g.originalIncidentId!==h.originalIncidentId||
  g.nextCeremonyId!==h.nextCeremonyId||
  g.leaseDisposition!==h.leaseDisposition||
  g.externalAnchorDigest!==h.priorQl437ExternalAnchorDigest||
  !HEX.test(g.independentReadbackDigest??'')||
  !HEX.test(g.pendingReceiptDigest??'')||!HEX.test(g.finalReceiptDigest??'')||
  f?.state!=='DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED'||
  f.connection!=='HOLD'||f.activationAuthorized!==false||
  f.receiver!=='OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK'||
  f.leaseExceptionEscalationRequired!==true||
  f.originalIncidentId!==h.originalIncidentId||
  f.nextCeremonyId!==h.nextCeremonyId||
  f.leaseDisposition!==h.leaseDisposition||
  !iso(f.leaseExpiresAt)||!HEX.test(f.pendingReceiptDigest??'')||
  !HEX.test(f.reconciledReceiptDigest??'')||
  e?.state!=='DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION'||
  e.connection!=='HOLD'||e.activationAuthorized!==false||
  e.originalIncidentId!==h.originalIncidentId||
  e.nextCeremonyId!==h.nextCeremonyId||
  e.leaseExpiresAt!==f.leaseExpiresAt||
  !ID.test(e.nextEpisodeId??'')||
  !HEX.test(e.pendingReceiptDigest??'')||!HEX.test(e.acceptedReceiptDigest??'')||
  d?.state!=='DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF'||
  d.connection!=='HOLD'||d.activationAuthorized!==false||
  d.incidentId!==h.originalIncidentId||
  d.nextCeremonyId!==h.nextCeremonyId||
  d.nextEpisodeId!==e.nextEpisodeId||
  !HEX.test(d.readinessRecordDigest??'')||
  c?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  c.connection!=='HOLD'||c.incidentId!==h.originalIncidentId||
  c.nextCeremonyId!==h.nextCeremonyId||c.nextEpisodeId!==e.nextEpisodeId||
  !HEX.test(c.precheckRecordDigest??'')||
  b?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  b.connection!=='HOLD'||b.incidentId!==h.originalIncidentId||
  !HEX.test(b.ownerReviewReceiptDigest??'')||
  !HEX.test(b.checkpointDigest??'')||
  !Number.isSafeInteger(b.checkpointIndex)||b.checkpointIndex<3||
  !same(s,c.scope)||!same(c.scope,b.scope)||
  typeof ql438Ledger?.read!=='function'||
  typeof ql437Ledger?.read!=='function'||
  typeof ql436Ledger?.read!=='function'||
  typeof ql435Ledger?.read!=='function'||
  typeof ql434Ledger?.read!=='function'||
  typeof ql433Ledger?.read!=='function'||
  typeof ql432Ledger?.read!=='function'||
  typeof ql431Store?.read!=='function')return null;
 try{
  const hPending=ql438Ledger.read('pending',h.originalIncidentId),
   hClosed=ql438Ledger.read('closed',h.originalIncidentId),
   gPending=ql437Ledger.read('pending',h.originalIncidentId),
   gFinal=ql437Ledger.read('final',h.originalIncidentId),
   fPending=ql436Ledger.read('pending',h.nextCeremonyId),
   fReconciled=ql436Ledger.read('reconciled',h.nextCeremonyId),
   ePending=ql435Ledger.read('pending',h.nextCeremonyId),
   eAccepted=ql435Ledger.read('accepted',h.nextCeremonyId),
   dReceipt=ql434Ledger.read(h.originalIncidentId),
   cReceipt=ql433Ledger.read(h.originalIncidentId),
   bReceipt=ql432Ledger.read(h.originalIncidentId),
   aReceipt=ql431Store.read(s);
  if(hPending?.recordDigest!==h.pendingReceiptDigest||
   hClosed?.recordDigest!==h.closedReceiptDigest||
   gPending?.recordDigest!==g.pendingReceiptDigest||
   gFinal?.recordDigest!==g.finalReceiptDigest||
   fPending?.recordDigest!==f.pendingReceiptDigest||
   fReconciled?.recordDigest!==f.reconciledReceiptDigest||
   ePending?.recordDigest!==e.pendingReceiptDigest||
   eAccepted?.recordDigest!==e.acceptedReceiptDigest||
   dReceipt?.recordDigest!==d.readinessRecordDigest||
   cReceipt?.recordDigest!==c.precheckRecordDigest||
   bReceipt?.recordDigest!==b.ownerReviewReceiptDigest||
   aReceipt?.entry?.kind!=='RECONCILED'||
   aReceipt.entry.incidentId!==h.originalIncidentId||
   aReceipt.index!==b.checkpointIndex||
   aReceipt.recordDigest!==b.checkpointDigest)return null;
  return {scope:s,ql431:aReceipt.recordDigest,ql432:bReceipt.recordDigest,
   ql433:cReceipt.recordDigest,ql434:dReceipt.recordDigest,
   ql435Pending:ePending.recordDigest,ql435Accepted:eAccepted.recordDigest,
   ql436Pending:fPending.recordDigest,ql436Reconciled:fReconciled.recordDigest,
   ql437Pending:gPending.recordDigest,ql437Final:gFinal.recordDigest,
   ql438Pending:hPending.recordDigest,ql438Closed:hClosed.recordDigest};
 }catch{return null;}
}
export function prepareQl439NewCeremonyReadiness({
 ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
 ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store,
 proposedCeremonyId,proposedEpisodeId,renewalNonce
},{nowMs,protectedOriginalHostSession=false,independentQl438ClosureVerified=false}={}){
 if(!Number.isSafeInteger(nowMs)||!protectedOriginalHostSession||
  !independentQl438ClosureVerified||!ID.test(proposedCeremonyId??'')||
  !ID.test(proposedEpisodeId??'')||!ID.test(renewalNonce??'')||
  proposedCeremonyId===ql438Closure?.nextCeremonyId||
  proposedEpisodeId===ql435Decision?.nextEpisodeId||
  proposedCeremonyId===ql434Readiness?.scope?.ceremonyId||
  proposedEpisodeId===ql434Readiness?.scope?.episodeId)
  return hold('PROTECTED_NEW_DISTINCT_CEREMONY_AND_INDEPENDENT_CLOSURE_REQUIRED');
 const prior=verifiedPredecessors({ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
  ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store});
 if(!prior)return hold('EXACT_QL431_TO_QL438_PRIVATE_CLOSURE_CHAIN_REQUIRED');
 const h=ql438Closure,f=ql436Review;
 const request={schema:'rosevear.ql439.corrective-closure-anchor-renewal-request.v1',
  scope:prior.scope,originalHostId:'DESKTOP-AE894KC',
  originalIncidentId:h.originalIncidentId,
  closedRemediationId:h.remediationId,
  previousCeremonyId:h.nextCeremonyId,
  previousEpisodeId:ql435Decision.nextEpisodeId,
  proposedCeremonyId,proposedEpisodeId,renewalNonce,
  sourceRevision:prior.scope.sourceRevision,
  controllerRevision:prior.scope.controllerRevision,
  leaseDisposition:h.leaseDisposition,
  oldLeaseExpiresAt:f.leaseExpiresAt,
  ql431CheckpointDigest:prior.ql431,ql432OwnerReceiptDigest:prior.ql432,
  ql433PrecheckReceiptDigest:prior.ql433,ql434ReadinessReceiptDigest:prior.ql434,
  ql435PendingReceiptDigest:prior.ql435Pending,
  ql435AcceptedReceiptDigest:prior.ql435Accepted,
  ql436PendingReceiptDigest:prior.ql436Pending,
  ql436ReconciledReceiptDigest:prior.ql436Reconciled,
  ql437PendingReceiptDigest:prior.ql437Pending,
  ql437FinalReceiptDigest:prior.ql437Final,
  ql438PendingReceiptDigest:prior.ql438Pending,
  ql438ClosedReceiptDigest:prior.ql438Closed,
  ql438CorrectiveAnchorDigest:h.remediationAnchorDigest,
  ql438IndependentReaderDigest:h.independentAnchorReadbackDigest,
  requestedAction:'RENEW_OFF_CLOSURE_ANCHOR_AND_PREPARE_FRESH_CEREMONY_ONLY_NO_ON',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL439_NEW_CEREMONY_READINESS_PREPARED_NOT_AUTHORIZED',
  request,requestDigest:hash(request),connection:'HOLD',
  receiver:'UNKNOWN_UNTIL_FRESH_INDEPENDENT_OFF_REVALIDATION',
  activationAuthorized:false,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function externalRenewal(e,r,opts){
 const a=e?.anchor?.payload,b=e?.reader?.payload;
 if(opts.independentRenewalPinVerified!==true||
  opts.independentRenewalReaderPinVerified!==true||
  opts.renewalPin===opts.renewalReaderPin||
  !exact(e,['anchor','reader'])||
  !exact(e.anchor,['payload','signature'])||
  !exact(e.reader,['payload','signature'])||
  !exact(a,['schema','requestDigest','originalIncidentId',
   'previousRemediationAnchorDigest','previousIndependentReaderDigest',
   'proposedCeremonyId','proposedEpisodeId','renewalNonce','status','renewedAt'])||
  a.schema!=='rosevear.ql439.independent-corrective-closure-anchor-renewal.v1'||
  a.requestDigest!==hash(r)||a.originalIncidentId!==r.originalIncidentId||
  a.previousRemediationAnchorDigest!==r.ql438CorrectiveAnchorDigest||
  a.previousIndependentReaderDigest!==r.ql438IndependentReaderDigest||
  a.proposedCeremonyId!==r.proposedCeremonyId||
  a.proposedEpisodeId!==r.proposedEpisodeId||
  a.renewalNonce!==r.renewalNonce||
  a.status!=='INDEPENDENT_RENEWED_CORRECTIVE_CLOSURE_ANCHOR_NO_ACTIVATION'||
  !fresh(a.renewedAt,opts.nowMs)||
  Date.parse(a.renewedAt)<Date.parse(r.preparedAt)||
  !validSig(a,e.anchor.signature,opts.renewalPin)||
  !exact(b,['schema','requestDigest','originalIncidentId',
   'proposedCeremonyId','renewalNonce','renewedAnchorDigest',
   'previousIndependentReaderDigest','status','readAt'])||
  b.schema!=='rosevear.ql439.independent-renewed-anchor-readback.v1'||
  b.requestDigest!==hash(r)||b.originalIncidentId!==r.originalIncidentId||
  b.proposedCeremonyId!==r.proposedCeremonyId||
  b.renewalNonce!==r.renewalNonce||
  b.renewedAnchorDigest!==hash(a)||
  b.previousIndependentReaderDigest!==r.ql438IndependentReaderDigest||
  b.status!=='INDEPENDENT_SIGNED_RENEWED_ANCHOR_READBACK'||
  !fresh(b.readAt,opts.nowMs)||Date.parse(b.readAt)<Date.parse(a.renewedAt)||
  !validSig(b,e.reader.signature,opts.renewalReaderPin))return null;
 return {anchorDigest:hash(a),readerDigest:hash(b),readerAt:b.readAt};
}
function verifiedHostOff(e,r,renew,opts){
 const p=e?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','requestDigest','originalIncidentId',
   'hostMachineId','scope','proposedCeremonyId','proposedEpisodeId',
   'renewalNonce','renewedAnchorDigest','renewedReadbackDigest',
   'receiverState','failClosedShutdownArmed','offContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql439.original-host-post-remediation-off.v1'&&
  p.requestDigest===hash(r)&&p.originalIncidentId===r.originalIncidentId&&
  p.hostMachineId==='DESKTOP-AE894KC'&&same(p.scope,r.scope)&&
  p.proposedCeremonyId===r.proposedCeremonyId&&
  p.proposedEpisodeId===r.proposedEpisodeId&&p.renewalNonce===r.renewalNonce&&
  p.renewedAnchorDigest===renew.anchorDigest&&
  p.renewedReadbackDigest===renew.readerDigest&&p.receiverState==='OFF'&&
  p.failClosedShutdownArmed===true&&
  Number.isSafeInteger(p.offContinuitySequence)&&p.offContinuitySequence>=1&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(renew.readerAt)&&
  validSig(p,e.signature,opts.originalHostPin);
}
function verifiedIndependentOff(e,r,host,renew,opts){
 const p=e?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','requestDigest','originalIncidentId',
   'proposedCeremonyId','proposedEpisodeId','renewalNonce',
   'hostOffDigest','renewedAnchorReadbackDigest','receiverState',
   'offContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql439.independent-post-remediation-off.v1'&&
  p.requestDigest===hash(r)&&p.originalIncidentId===r.originalIncidentId&&
  p.proposedCeremonyId===r.proposedCeremonyId&&
  p.proposedEpisodeId===r.proposedEpisodeId&&
  p.renewalNonce===r.renewalNonce&&
  p.hostOffDigest===hash(host.payload)&&
  p.renewedAnchorReadbackDigest===renew.readerDigest&&
  p.receiverState==='OFF'&&Number.isSafeInteger(p.offContinuitySequence)&&
  p.offContinuitySequence>=host.payload.offContinuitySequence&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  validSig(p,e.signature,opts.receiverPin);
}
function verifiedMasterDecisions(reports,r,renew,off,opts){
 if(opts.independentMasterPinsVerified!==true||!opts.masterPins||
  !Array.isArray(reports)||reports.length!==3)return null;
 const accepted=[],seen=new Set();
 for(const e of reports){
  const p=e?.payload;
  if(!exact(e,['payload','signature'])||
   !exact(p,['schema','masterId','requestDigest','originalIncidentId',
    'proposedCeremonyId','proposedEpisodeId','renewalNonce',
    'renewedAnchorReadbackDigest','independentOffDigest','status','reviewedAt'])||
   p.schema!=='rosevear.ql439.master-corrective-continuity-readiness.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.requestDigest!==hash(r)||p.originalIncidentId!==r.originalIncidentId||
   p.proposedCeremonyId!==r.proposedCeremonyId||
   p.proposedEpisodeId!==r.proposedEpisodeId||
   p.renewalNonce!==r.renewalNonce||
   p.renewedAnchorReadbackDigest!==renew.readerDigest||
   p.independentOffDigest!==hash(off.payload)||
   p.status!=='SIGNED_NEW_CEREMONY_PREPARED_ONLY_RECEIVER_OFF_NO_ACTIVATION'||
   !fresh(p.reviewedAt,opts.nowMs)||
   Date.parse(p.reviewedAt)<Date.parse(off.payload.observedAt)||
   !validSig(p,e.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 return {reportsDigest:hash(accepted),
  latestAt:Math.max(...accepted.map(x=>Date.parse(x.reviewedAt)))};
}
function verifiedOwnerReadiness(e,r,renew,off,masters,opts){
 const p=e?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  opts.ownerPin!==opts.reviewerPin&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','requestDigest','originalIncidentId',
   'proposedCeremonyId','proposedEpisodeId','renewalNonce',
   'renewedAnchorDigest','renewedReadbackDigest','independentOffDigest',
   'masterReportsDigest','priorClosureState','action',
   'ownerId','reviewerId','approvedAt'])&&
  p.schema==='rosevear.ql439.dual-owner-new-ceremony-readiness.v1'&&
  p.requestDigest===hash(r)&&p.originalIncidentId===r.originalIncidentId&&
  p.proposedCeremonyId===r.proposedCeremonyId&&
  p.proposedEpisodeId===r.proposedEpisodeId&&
  p.renewalNonce===r.renewalNonce&&
  p.renewedAnchorDigest===renew.anchorDigest&&
  p.renewedReadbackDigest===renew.readerDigest&&
  p.independentOffDigest===hash(off.payload)&&
  p.masterReportsDigest===masters.reportsDigest&&
  p.priorClosureState==='QL438_DURABLE_CORRECTIVE_EXCEPTION_CLOSED'&&
  p.action==='OWNER_REVIEW_PREPARE_FRESH_QL429_QL430_AUTHORITY_ONLY_NO_ACTIVATION'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&fresh(p.approvedAt,opts.nowMs)&&
  Date.parse(p.approvedAt)>=masters.latestAt&&
  validSig(p,e.ownerSignature,opts.ownerPin)&&
  validSig(p,e.reviewerSignature,opts.reviewerPin);
}
export function openQl439ProtectedReadinessLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL439_ABSOLUTE_PROTECTED_LEDGER_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL439_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','readiness'].includes(kind)||!ID.test(id??''))
   throw Error('QL439_INVALID_LEDGER_KEY');
  return join(root,'ql439-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;try{raw=readFileSync(file(kind,id),'utf8');}
  catch(err){if(err.code==='ENOENT')return null;throw err;}
  if(raw.length>4096)throw Error('QL439_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL439_RECORD_CORRUPT');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql439.corrective-closure-readiness-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))
   throw Error('QL439_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL439_INVALID_EVIDENCE_DIGEST');
  if(read(kind,id))throw Error('QL439_REPLAYED_INCIDENT');
  const rec={schema:'rosevear.ql439.corrective-closure-readiness-custody.v1',
   kind,incidentId:id,evidenceDigest};
  rec.recordDigest=hash(rec);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}
  finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)
   throw Error('QL439_LEDGER_READBACK_MISMATCH');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
export function readQl439ReadinessContinuity(ledger,incidentId){
 try{
  const pending=ledger.read('pending',incidentId),
   ready=ledger.read('readiness',incidentId);
  if(ready&&!pending)return hold('QL439_READINESS_WITHOUT_PENDING_INVALID');
  if(ready)return {...hold('PRIVATE_READINESS_RECORD_NOT_LIVE_OFF_PROOF'),
   state:'QL439_DURABLE_PRIVATE_READINESS_FRESH_OFF_RECHECK_REQUIRED',
   pendingReceiptDigest:pending.recordDigest,
   readinessReceiptDigest:ready.recordDigest};
  if(pending)return {...hold('QL439_RENEWAL_OR_READINESS_INCOMPLETE'),
   pendingReceiptDigest:pending.recordDigest};
  return hold('QL439_NO_RENEWAL_EVIDENCE');
 }catch{return hold('QL439_READINESS_LEDGER_UNREADABLE');}
}
/** Holds receiver OFF. Never executes activation or creates fresh QL-429/430
 * enrollment credentials. Original host and external anchor are independent
 * read-only adapter providers; immutable external custody is not provisioned.
 */
export async function runQl439RenewedAnchorOffReadiness({
 ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
 ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store,
 readinessLedger,proposedCeremonyId,proposedEpisodeId,renewalNonce,
 externalRenewalProvider,originalHostAdapter,independentReceiverAdapter,
 masterEvidenceProvider,ownerDecision
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl438ClosureVerified!==true||
  typeof readinessLedger?.read!=='function'||
  typeof readinessLedger?.claimOnce!=='function'||
  typeof externalRenewalProvider?.readSignedRenewal!=='function'||
  typeof originalHostAdapter?.readSignedOff!=='function'||
  typeof independentReceiverAdapter?.readSignedOff!=='function'||
  typeof masterEvidenceProvider?.readSignedReports!=='function')
  return hold('PROTECTED_ORIGINAL_HOST_INDEPENDENT_RENEWAL_AUTHORITY_REQUIRED');
 const args={ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
  ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,
  proposedCeremonyId,proposedEpisodeId,renewalNonce};
 const prep=prepareQl439NewCeremonyReadiness(args,{
  nowMs:opts.nowMs,protectedOriginalHostSession:true,
  independentQl438ClosureVerified:true});
 if(prep.state!=='QL439_NEW_CEREMONY_READINESS_PREPARED_NOT_AUTHORIZED')
  return hold('EXACT_QL431_TO_QL438_CLOSURE_CHAIN_OR_NEW_CEREMONY_INVALID');
 const r=prep.request;
 const pins=[opts.renewalPin,opts.renewalReaderPin,opts.originalHostPin,
  opts.receiverPin,opts.ownerPin,opts.reviewerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_SIGNER_PIN_CUSTODY_REQUIRED');
 try{
  if(readinessLedger.read('pending',r.originalIncidentId)||
   readinessLedger.read('readiness',r.originalIncidentId))
   return hold('QL439_INCIDENT_READINESS_ALREADY_CONSUMED');
 }catch{return hold('QL439_PROTECTED_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=readinessLedger.claimOnce('pending',r.originalIncidentId,hash({
   requestDigest:prep.requestDigest,
   closedReceiptDigest:r.ql438ClosedReceiptDigest,
   previousRemediationAnchorDigest:r.ql438CorrectiveAnchorDigest,
   proposedCeremonyId,proposedEpisodeId,renewalNonce}));
  if(readinessLedger.read('pending',r.originalIncidentId)?.recordDigest!==
   pending.recordDigest)throw Error('QL439_PENDING_READBACK_FAILED');
 }catch{return hold('QL439_PENDING_RENEWAL_CUSTODY_WRITE_FAILED');}
 let envelope;
 try{envelope=await externalRenewalProvider.readSignedRenewal({
  request:r,requestDigest:prep.requestDigest,
  pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('INDEPENDENT_EXTERNAL_CLOSURE_ANCHOR_RENEWAL_UNAVAILABLE');}
 const renew=externalRenewal(envelope,r,opts);
 if(!renew)return hold('RENEWED_CLOSURE_ANCHOR_OR_DISTINCT_READER_REJECTED');
 let host;
 try{host=await originalHostAdapter.readSignedOff({
  request:r,renewedAnchorDigest:renew.anchorDigest,
  independentReaderDigest:renew.readerDigest,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_FRESH_POST_REMEDIATION_OFF_UNAVAILABLE');}
 if(!verifiedHostOff(host,r,renew,opts))
  return hold('ORIGINAL_HOST_SIGNED_OFF_WATCHDOG_CONTINUITY_INVALID');
 let off;
 try{off=await independentReceiverAdapter.readSignedOff({
  request:r,hostOffDigest:hash(host.payload),
  renewedAnchorReadbackDigest:renew.readerDigest,requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_FRESH_RECEIVER_OFF_UNAVAILABLE');}
 if(!verifiedIndependentOff(off,r,host,renew,opts))
  return hold('INDEPENDENT_SIGNED_POST_REMEDIATION_OFF_INVALID');
 let reports;
 try{reports=await masterEvidenceProvider.readSignedReports({
  request:r,independentOffDigest:hash(off.payload),
  renewedAnchorReadbackDigest:renew.readerDigest});}
 catch{return hold('THREE_MASTER_NEW_CEREMONY_READINESS_UNAVAILABLE');}
 const masters=verifiedMasterDecisions(reports,r,renew,off,opts);
 if(!masters)return hold('THREE_MASTER_SIGNED_READINESS_REJECTED');
 if(!verifiedOwnerReadiness(ownerDecision,r,renew,off,masters,opts))
  return hold('DUAL_OWNER_NEW_CEREMONY_READINESS_REJECTED');
 try{
  const latest=verifiedPredecessors(args);
  if(!latest||latest.ql438Closed!==r.ql438ClosedReceiptDigest||
   latest.ql437Final!==r.ql437FinalReceiptDigest||
   latest.ql431!==r.ql431CheckpointDigest||
   readinessLedger.read('pending',r.originalIncidentId)?.recordDigest!==
    pending.recordDigest)
   return hold('QL431_TO_QL438_PRIVATE_CUSTODY_CHANGED_DURING_RENEWAL');
  const ready=readinessLedger.claimOnce('readiness',r.originalIncidentId,hash({
   requestDigest:prep.requestDigest,pendingDigest:pending.recordDigest,
   renewalAnchorDigest:renew.anchorDigest,
   renewalReaderDigest:renew.readerDigest,
   originalHostOffDigest:hash(host.payload),
   independentOffDigest:hash(off.payload),
   mastersDigest:masters.reportsDigest,
   ownerDecisionDigest:hash(ownerDecision.payload)}));
  if(readinessLedger.read('readiness',r.originalIncidentId)?.recordDigest!==
   ready.recordDigest)throw Error('QL439_READINESS_READBACK_FAILED');
  return {...hold('RENEWED_CLOSURE_ANCHOR_AND_SIGNED_OFF_READINESS_ONLY'),
   state:'DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY',
   receiver:'OFF_VERIFIED_POST_REMEDIATION_INDEPENDENT_READBACK',
   ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PREPARATION_ONLY',
   originalIncidentId:r.originalIncidentId,
   previousCeremonyId:r.previousCeremonyId,
   proposedCeremonyId,proposedEpisodeId,renewalNonce,
   renewedClosureAnchorDigest:renew.anchorDigest,
   independentRenewalReadbackDigest:renew.readerDigest,
   pendingReceiptDigest:pending.recordDigest,
   readinessReceiptDigest:ready.recordDigest,masterCount:3,
   permittedNextAction:'NEW_QL429_QL430_FRESH_SEPARATELY_AUTHORIZED_ENROLLMENT_NOT_ACTIVATED'};
 }catch{return hold('QL439_PROTECTED_READINESS_CUSTODY_COMMIT_FAILED');}
}
