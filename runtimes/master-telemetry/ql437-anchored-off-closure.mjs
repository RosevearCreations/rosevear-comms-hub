import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const DISPOSITIONS=['WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED',
 'LATE_HOST_SHUTDOWN_ESCALATION','LATE_INDEPENDENT_OFF_READBACK_ESCALATION'];
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>iso(s)&&Number.isSafeInteger(now)&&
 Date.parse(s)<=now&&now-Date.parse(s)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'UNKNOWN_PENDING_INDEPENDENT_OFF_REVALIDATION',
 activationAuthorized:false,ownerAcceptance:'HOLD',
 manualReceiverIsolationRequired:true,runtimeUptime:'UNKNOWN',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const k=createPublicKey({key:der,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),k,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeValid=s=>exact(s,['ceremonyId','sourceId','episodeId',
 'sourceRevision','controllerRevision'])&&s.sourceId==='rosevear-ai-hub'&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
function trustedChain({ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store}){
 const q=ql436Review,p=ql435Decision,r=ql434Readiness,
  a=ql433Precheck,b=ql432Decision,s=r?.scope;
 if(!scopeValid(s)||q?.state!=='DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED'||
  q.connection!=='HOLD'||q.receiver!=='OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK'||
  q.ownerAcceptance!=='DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY'||
  q.masterCount!==3||q.activationAuthorized!==false||
  q.permittedNextAction!=='SUPERVISED_POST_OFF_CONTINUITY_REVIEW_NO_AUTOMATIC_REENTRY'||
  !ID.test(q.originalIncidentId??'')||!ID.test(q.incidentReviewId??'')||
  !ID.test(q.nextCeremonyId??'')||!ID.test(q.shutdownNonce??'')||
  !iso(q.leaseExpiresAt)||!DISPOSITIONS.includes(q.leaseDisposition)||
  q.leaseExceptionEscalationRequired!==(q.leaseDisposition!==DISPOSITIONS[0])||
  !HEX.test(q.pendingReceiptDigest??'')||!HEX.test(q.reconciledReceiptDigest??'')||
  p?.state!=='DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION'||
  p.connection!=='HOLD'||p.activationAuthorized!==false||
  p.receiver!=='ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY'||p.masterCount!==3||
  p.ownerAcceptance!=='DUAL_SIGNED_SINGLE_PILOT_EVIDENCE_REVIEW'||
  p.originalIncidentId!==q.originalIncidentId||
  p.nextCeremonyId!==q.nextCeremonyId||
  p.leaseExpiresAt!==q.leaseExpiresAt||
  !ID.test(p.nextEpisodeId??'')||!HEX.test(p.pendingReceiptDigest??'')||
  !HEX.test(p.acceptedReceiptDigest??'')||
  r?.state!=='DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF'||
  r.connection!=='HOLD'||r.activationAuthorized!==false||
  r.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||r.masterCount!==3||
  r.incidentId!==q.originalIncidentId||
  r.nextCeremonyId!==q.nextCeremonyId||r.nextEpisodeId!==p.nextEpisodeId||
  !HEX.test(r.readinessRecordDigest??'')||
  a?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  a.connection!=='HOLD'||a.masterCount!==3||
  a.incidentId!==q.originalIncidentId||
  a.nextCeremonyId!==q.nextCeremonyId||a.nextEpisodeId!==p.nextEpisodeId||
  !HEX.test(a.precheckRecordDigest??'')||
  b?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  b.connection!=='HOLD'||b.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  b.masterCount!==3||b.incidentId!==q.originalIncidentId||
  !HEX.test(b.ownerReviewReceiptDigest??'')||!HEX.test(b.checkpointDigest??'')||
  !Number.isSafeInteger(b.checkpointIndex)||b.checkpointIndex<3||
  !equal(s,a.scope)||!equal(a.scope,b.scope)||
  typeof ql436Ledger?.read!=='function'||typeof ql435Ledger?.read!=='function'||
  typeof ql434Ledger?.read!=='function'||typeof ql433Ledger?.read!=='function'||
  typeof ql432Ledger?.read!=='function'||typeof ql431Store?.read!=='function')
  return null;
 try{
  const pending=ql436Ledger.read('pending',q.nextCeremonyId),
   reconciled=ql436Ledger.read('reconciled',q.nextCeremonyId),
   qp=ql435Ledger.read('pending',q.nextCeremonyId),
   qa=ql435Ledger.read('accepted',q.nextCeremonyId),
   qr=ql434Ledger.read(q.originalIncidentId),
   qs=ql433Ledger.read(q.originalIncidentId),
   qt=ql432Ledger.read(q.originalIncidentId),
   qc=ql431Store.read(s);
  if(pending?.recordDigest!==q.pendingReceiptDigest||
   reconciled?.recordDigest!==q.reconciledReceiptDigest||
   qp?.recordDigest!==p.pendingReceiptDigest||
   qa?.recordDigest!==p.acceptedReceiptDigest||
   qr?.recordDigest!==r.readinessRecordDigest||
   qs?.recordDigest!==a.precheckRecordDigest||
   qt?.recordDigest!==b.ownerReviewReceiptDigest||
   qc?.entry?.kind!=='RECONCILED'||
   qc.entry.incidentId!==q.originalIncidentId||
   qc.index!==b.checkpointIndex||qc.recordDigest!==b.checkpointDigest)
   return null;
  return {scope:s,ql431Digest:qc.recordDigest,ql432Digest:qt.recordDigest,
   ql433Digest:qs.recordDigest,ql434Digest:qr.recordDigest,
   ql435PendingDigest:qp.recordDigest,ql435AcceptedDigest:qa.recordDigest,
   ql436PendingDigest:pending.recordDigest,
   ql436ReconciledDigest:reconciled.recordDigest};
 }catch{return null;}
}
export function prepareQl437PostShutdownEvidenceExport(args,{
 nowMs,protectedOriginalHostSession=false,
 independentQl436ReviewVerified=false
}={}){
 if(!protectedOriginalHostSession||!independentQl436ReviewVerified||
  !Number.isSafeInteger(nowMs)||!ID.test(args?.exportId??'')||
  !ID.test(args?.anchorChallengeNonce??''))
  return hold('ORIGINAL_HOST_PROTECTED_INDEPENDENT_QL436_REVIEW_REQUIRED');
 const chain=trustedChain(args);
 if(!chain)return hold('EXACT_QL431_THROUGH_QL436_DURABLE_CUSTODY_UNVERIFIED');
 const q=args.ql436Review,p=args.ql435Decision;
 const record={schema:'rosevear.ql437.post-shutdown-off-evidence-export.v1',
  scope:chain.scope,originalIncidentId:q.originalIncidentId,
  incidentReviewId:q.incidentReviewId,nextCeremonyId:q.nextCeremonyId,
  nextEpisodeId:p.nextEpisodeId,
  leaseExpiresAt:q.leaseExpiresAt,leaseDisposition:q.leaseDisposition,
  exceptionEscalationRequired:q.leaseExceptionEscalationRequired,
  ql431CheckpointDigest:chain.ql431Digest,
  ql432OwnerReceiptDigest:chain.ql432Digest,
  ql433PrecheckReceiptDigest:chain.ql433Digest,
  ql434ReadinessReceiptDigest:chain.ql434Digest,
  ql435PendingReceiptDigest:chain.ql435PendingDigest,
  ql435AcceptedReceiptDigest:chain.ql435AcceptedDigest,
  ql436PendingReceiptDigest:chain.ql436PendingDigest,
  ql436ReconciledReceiptDigest:chain.ql436ReconciledDigest,
  exportId:args.exportId,anchorChallengeNonce:args.anchorChallengeNonce,
  originalHostId:'DESKTOP-AE894KC',
  action:'INDEPENDENT_ANCHOR_OFF_EVIDENCE_NO_ACTIVATION_NO_REENTRY',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL437_OFF_EVIDENCE_EXPORT_PREPARED_NOT_EXTERNALLY_ANCHORED',
  exportRecord:record,exportDigest:hash(record),
  connection:'HOLD',activationAuthorized:false,
  receiver:'UNKNOWN_PENDING_INDEPENDENT_OFF_REVALIDATION',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function independentAnchor(a,r,opts){
 const x=a?.anchor?.payload,y=a?.reader?.payload;
 if(opts.independentAnchorPinVerified!==true||
  opts.independentReaderPinVerified!==true||
  opts.anchorPin===opts.readerPin||
  !fresh(r.preparedAt,opts.nowMs)||
  !exact(a,['anchor','reader'])||
  !exact(a.anchor,['payload','signature'])||
  !exact(a.reader,['payload','signature'])||
  !exact(x,['schema','exportId','anchorChallengeNonce','exportDigest',
   'originalIncidentId','incidentReviewId','nextCeremonyId',
   'ql436ReconciledReceiptDigest','leaseDisposition','status','anchoredAt'])||
  x.schema!=='rosevear.ql437.external-off-evidence-anchor.v1'||
  x.exportId!==r.exportId||x.anchorChallengeNonce!==r.anchorChallengeNonce||
  x.exportDigest!==hash(r)||x.originalIncidentId!==r.originalIncidentId||
  x.incidentReviewId!==r.incidentReviewId||
  x.nextCeremonyId!==r.nextCeremonyId||
  x.ql436ReconciledReceiptDigest!==r.ql436ReconciledReceiptDigest||
  x.leaseDisposition!==r.leaseDisposition||
  x.status!=='EXTERNAL_IMMUTABLE_SIGNED_OFF_EVIDENCE_ANCHORED'||
  !fresh(x.anchoredAt,opts.nowMs)||
  Date.parse(x.anchoredAt)<Date.parse(r.preparedAt)||
  !signed(x,a.anchor.signature,opts.anchorPin)||
  !exact(y,['schema','exportId','anchorChallengeNonce','exportDigest',
   'externalAnchorDigest','originalIncidentId','status','readAt'])||
  y.schema!=='rosevear.ql437.independent-off-anchor-readback.v1'||
  y.exportId!==r.exportId||y.anchorChallengeNonce!==r.anchorChallengeNonce||
  y.exportDigest!==hash(r)||y.externalAnchorDigest!==hash(x)||
  y.originalIncidentId!==r.originalIncidentId||
  y.status!=='INDEPENDENT_EXACT_ANCHORED_OFF_EVIDENCE_READBACK'||
  !fresh(y.readAt,opts.nowMs)||
  Date.parse(y.readAt)<Date.parse(x.anchoredAt)||
  !signed(y,a.reader.signature,opts.readerPin))return null;
 return {anchorDigest:hash(x),readbackDigest:hash(y),readAt:y.readAt};
}
function originalHostOff(e,r,a,opts){
 const p=e?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','hostMachineId','scope','originalIncidentId',
   'nextCeremonyId','exportId','anchorChallengeNonce',
   'anchorDigest','independentReadbackDigest','receiverState',
   'shutdownContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql437.original-host-post-shutdown-off.v1'&&
  p.hostMachineId==='DESKTOP-AE894KC'&&equal(p.scope,r.scope)&&
  p.originalIncidentId===r.originalIncidentId&&
  p.nextCeremonyId===r.nextCeremonyId&&p.exportId===r.exportId&&
  p.anchorChallengeNonce===r.anchorChallengeNonce&&
  p.anchorDigest===a.anchorDigest&&
  p.independentReadbackDigest===a.readbackDigest&&p.receiverState==='OFF'&&
  Number.isSafeInteger(p.shutdownContinuitySequence)&&
  p.shutdownContinuitySequence>=1&&fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(a.readAt)&&
  signed(p,e.signature,opts.originalHostPin);
}
function independentOff(e,r,a,host,opts){
 const p=e?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','originalIncidentId','nextCeremonyId','exportId',
   'anchorChallengeNonce','hostOffDigest','independentAnchorReadbackDigest',
   'receiverState','offContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql437.independent-post-shutdown-off.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.nextCeremonyId===r.nextCeremonyId&&p.exportId===r.exportId&&
  p.anchorChallengeNonce===r.anchorChallengeNonce&&
  p.hostOffDigest===hash(host.payload)&&
  p.independentAnchorReadbackDigest===a.readbackDigest&&
  p.receiverState==='OFF'&&
  Number.isSafeInteger(p.offContinuitySequence)&&
  p.offContinuitySequence>=host.payload.shutdownContinuitySequence&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signed(p,e.signature,opts.receiverPin);
}
function masters(reports,r,a,off,opts){
 if(opts.independentMasterPinsVerified!==true||
  !Array.isArray(reports)||reports.length!==3||!opts.masterPins)return null;
 const accepted=[],seen=new Set();
 for(const e of reports){
  const p=e?.payload;
  if(!exact(e,['payload','signature'])||
   !exact(p,['schema','masterId','originalIncidentId',
    'nextCeremonyId','exportDigest','independentAnchorReadbackDigest',
    'independentOffDigest','leaseDisposition','status','observedAt'])||
   p.schema!=='rosevear.ql437.master-post-shutdown-incident-continuity.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.originalIncidentId!==r.originalIncidentId||
   p.nextCeremonyId!==r.nextCeremonyId||
   p.exportDigest!==hash(r)||
   p.independentAnchorReadbackDigest!==a.readbackDigest||
   p.independentOffDigest!==hash(off.payload)||
   p.leaseDisposition!==r.leaseDisposition||
   p.status!=='SIGNED_POST_SHUTDOWN_OFF_HOLD_NO_REENTRY'||
   !fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<Date.parse(off.payload.observedAt)||
   !signed(p,e.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {mastersDigest:hash(accepted),
  latestAt:Math.max(...accepted.map(v=>Date.parse(v.observedAt)))};
}
function exceptionCustody(e,r,a,off,master,opts){
 const p=e?.payload;
 return opts.independentExceptionPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','originalIncidentId','incidentReviewId','nextCeremonyId',
   'exportDigest','independentAnchorReadbackDigest',
   'independentOffDigest','mastersDigest','leaseDisposition','status','recordedAt'])&&
  p.schema==='rosevear.ql437.independent-expired-lease-custody.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.incidentReviewId===r.incidentReviewId&&
  p.nextCeremonyId===r.nextCeremonyId&&p.exportDigest===hash(r)&&
  p.independentAnchorReadbackDigest===a.readbackDigest&&
  p.independentOffDigest===hash(off.payload)&&
  p.mastersDigest===master.mastersDigest&&
  p.leaseDisposition===r.leaseDisposition&&r.exceptionEscalationRequired===true&&
  p.status==='LEASE_EXCEPTION_INDEPENDENT_CUSTODY_OPEN_NOT_CLOSED'&&
  fresh(p.recordedAt,opts.nowMs)&&
  Date.parse(p.recordedAt)>=master.latestAt&&
  signed(p,e.signature,opts.exceptionPin);
}
function owners(e,r,a,off,master,exception,opts){
 const p=e?.payload;
 const late=r.exceptionEscalationRequired;
 const required=late?'ACK_LEASE_EXCEPTION_OPEN_NO_INCIDENT_CLOSURE_KEEP_HOLD':
  'ACK_ON_TIME_POST_SHUTDOWN_INCIDENT_CLOSURE_NO_REENTRY_KEEP_HOLD';
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','originalIncidentId','incidentReviewId',
   'exportDigest','independentAnchorReadbackDigest','independentOffDigest',
   'mastersDigest','exceptionCustodyDigest','leaseDisposition',
   'action','ownerId','reviewerId','reviewedAt'])&&
  p.schema==='rosevear.ql437.dual-owner-incident-closure-readback.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.incidentReviewId===r.incidentReviewId&&p.exportDigest===hash(r)&&
  p.independentAnchorReadbackDigest===a.readbackDigest&&
  p.independentOffDigest===hash(off.payload)&&
  p.mastersDigest===master.mastersDigest&&
  p.exceptionCustodyDigest===(late?hash(exception.payload):null)&&
  p.leaseDisposition===r.leaseDisposition&&p.action===required&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&opts.ownerPin!==opts.reviewerPin&&
  fresh(p.reviewedAt,opts.nowMs)&&
  Date.parse(p.reviewedAt)>=(late?
   Date.parse(exception.payload.recordedAt):master.latestAt)&&
  signed(p,e.ownerSignature,opts.ownerPin)&&
  signed(p,e.reviewerSignature,opts.reviewerPin);
}
export function openQl437ProtectedClosureLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL437_ABSOLUTE_PROTECTED_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL437_UNSAFE_PROTECTED_DIRECTORY');
 const pathname=(kind,id)=>{
  if(!['pending','final'].includes(kind)||!ID.test(id??''))
   throw Error('QL437_INVALID_LEDGER_KEY');
  return join(root,'ql437-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let data;
  try{data=readFileSync(pathname(kind,id),'utf8');}
  catch(err){if(err.code==='ENOENT')return null;throw err;}
  if(data.length>4096)throw Error('QL437_RECORD_TOO_LARGE');
  let rec;try{rec=JSON.parse(data);}catch{throw Error('QL437_RECORD_INVALID');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql437.incident-closure-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))
   throw Error('QL437_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL437_BAD_EVIDENCE_DIGEST');
  if(read(kind,id))throw Error('QL437_REPLAYED_INCIDENT');
  const rec={schema:'rosevear.ql437.incident-closure-custody.v1',
   kind,incidentId:id,evidenceDigest};
  rec.recordDigest=hash(rec);
  const fd=openSync(pathname(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}
  finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)
   throw Error('QL437_DURABLE_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
export function readQl437IncidentClosureContinuity(ledger,id){
 try{
  const pending=ledger.read('pending',id),final=ledger.read('final',id);
  if(final&&!pending)return hold('QL437_FINAL_WITHOUT_PENDING_TAMPERED');
  if(final)return {...hold('DURABLE_CLOSURE_RECORD_PRESENT_REQUIRES_FRESH_EXTERNAL_READBACK'),
   state:'QL437_PRIVATE_FINAL_RECORD_PRESENT_NOT_LIVE_OFF_PROOF',
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:final.recordDigest};
  if(pending)return {...hold('QL437_ANCHOR_OR_INDEPENDENT_OFF_CUSTODY_PENDING'),
   pendingReceiptDigest:pending.recordDigest};
  return hold('QL437_NO_INCIDENT_CLOSURE_RECORD');
 }catch{return hold('QL437_CLOSURE_LEDGER_UNREADABLE');}
}
/** External anchors/signers and original-host OFF are read-only protected adapters.
 * The module never enables, disables or restarts a receiver. A late lease can
 * only produce a durable OPEN exception, never an incident closure.
 */
export async function runQl437AnchoredOffClosure({
 ql436Review,ql436Ledger,ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 closureLedger,exportId,anchorChallengeNonce,
 externalAnchorProvider,originalHostAdapter,independentReceiverAdapter,
 masterProvider,independentExceptionProvider,ownerDecision
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl436ReviewVerified!==true||
  typeof closureLedger?.read!=='function'||typeof closureLedger?.claimOnce!=='function'||
  typeof externalAnchorProvider?.readSignedAnchor!=='function'||
  typeof originalHostAdapter?.readSignedOff!=='function'||
  typeof independentReceiverAdapter?.readSignedOff!=='function'||
  typeof masterProvider?.readSignedReports!=='function')
  return hold('ORIGINAL_HOST_PROTECTED_OWNER_SUPERVISED_READBACK_REQUIRED');
 const args={ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,exportId,anchorChallengeNonce};
 const prepared=prepareQl437PostShutdownEvidenceExport(args,{
  nowMs:opts.nowMs,protectedOriginalHostSession:true,
  independentQl436ReviewVerified:true});
 if(prepared.state!=='QL437_OFF_EVIDENCE_EXPORT_PREPARED_NOT_EXTERNALLY_ANCHORED')
  return hold('QL431_TO_QL436_EXACT_CUSTODY_AND_QL436_SIGNED_OFF_REQUIRED');
 const r=prepared.exportRecord;
 const pins=[opts.anchorPin,opts.readerPin,opts.originalHostPin,opts.receiverPin,
  opts.exceptionPin,opts.ownerPin,opts.reviewerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_SIGNING_KEY_CUSTODY_REQUIRED');
 if(r.exceptionEscalationRequired&&
  typeof independentExceptionProvider?.readSignedException!=='function')
  return hold('EXPIRED_LEASE_REQUIRES_INDEPENDENT_EXCEPTION_CUSTODY');
 try{if(closureLedger.read('pending',r.originalIncidentId)||
  closureLedger.read('final',r.originalIncidentId))
  return hold('QL437_ONE_USE_INCIDENT_ALREADY_IN_REVIEW');}
 catch{return hold('QL437_PRIVATE_INCIDENT_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=closureLedger.claimOnce('pending',r.originalIncidentId,hash({
   exportDigest:prepared.exportDigest,anchorChallengeNonce,
   ql436ReconciledReceiptDigest:r.ql436ReconciledReceiptDigest,
   leaseDisposition:r.leaseDisposition}));
  if(closureLedger.read('pending',r.originalIncidentId)?.recordDigest!==
   pending.recordDigest)throw Error('QL437_PENDING_READBACK_FAILED');
 }catch{return hold('QL437_PENDING_CUSTODY_WRITE_FAILED');}
 let anchorEnvelope;
 try{anchorEnvelope=await externalAnchorProvider.readSignedAnchor({
  exportRecord:r,exportDigest:prepared.exportDigest,
  exportId,anchorChallengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('INDEPENDENT_EXTERNAL_ANCHOR_READBACK_UNAVAILABLE');}
 const anchor=independentAnchor(anchorEnvelope,r,opts);
 if(!anchor)return hold('EXTERNAL_IMMUTABLE_ANCHOR_OR_DISTINCT_READER_REJECTED');
 let host;
 try{host=await originalHostAdapter.readSignedOff({
  exportRecord:r,anchorDigest:anchor.anchorDigest,
  independentReadbackDigest:anchor.readbackDigest,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_POST_SHUTDOWN_OFF_UNAVAILABLE');}
 if(!originalHostOff(host,r,anchor,opts))
  return hold('ORIGINAL_HOST_FRESH_SIGNED_OFF_READBACK_INVALID');
 let off;
 try{off=await independentReceiverAdapter.readSignedOff({
  exportRecord:r,hostOffDigest:hash(host.payload),
  independentAnchorReadbackDigest:anchor.readbackDigest,requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_RECEIVER_POST_SHUTDOWN_OFF_UNAVAILABLE');}
 if(!independentOff(off,r,anchor,host,opts))
  return hold('INDEPENDENT_FRESH_SIGNED_OFF_READBACK_INVALID');
 let reports;
 try{reports=await masterProvider.readSignedReports({
  exportRecord:r,independentAnchorReadbackDigest:anchor.readbackDigest,
  independentOffDigest:hash(off.payload)});}
 catch{return hold('THREE_MASTER_POST_SHUTDOWN_READBACK_UNAVAILABLE');}
 const master=masters(reports,r,anchor,off,opts);
 if(!master)return hold('THREE_MASTER_SIGNED_INCIDENT_CONTINUITY_REJECTED');
 let exception=null;
 if(r.exceptionEscalationRequired){
  try{exception=await independentExceptionProvider.readSignedException({
   exportRecord:r,masterDigest:master.mastersDigest,
   independentOffDigest:hash(off.payload),requiredStatus:'OPEN'});}
  catch{return hold('EXPIRED_LEASE_EXCEPTION_INDEPENDENT_CUSTODY_UNAVAILABLE');}
  if(!exceptionCustody(exception,r,anchor,off,master,opts))
   return hold('EXPIRED_LEASE_SIGNED_EXCEPTION_CUSTODY_REJECTED');
 }
 if(!owners(ownerDecision,r,anchor,off,master,exception,opts))
  return hold('DUAL_OWNER_CLOSURE_VS_OPEN_EXCEPTION_DECISION_REJECTED');
 try{
  const current=trustedChain(args);
  if(!current||current.ql436ReconciledDigest!==r.ql436ReconciledReceiptDigest||
   current.ql435AcceptedDigest!==r.ql435AcceptedReceiptDigest||
   current.ql431Digest!==r.ql431CheckpointDigest||
   closureLedger.read('pending',r.originalIncidentId)?.recordDigest!==
    pending.recordDigest)return hold('ORIGINAL_DURABLE_CUSTODY_CHANGED_BEFORE_OWNER_COMMIT');
  const final=closureLedger.claimOnce('final',r.originalIncidentId,hash({
   exportDigest:prepared.exportDigest,pendingDigest:pending.recordDigest,
   externalAnchorDigest:anchor.anchorDigest,
   independentReadbackDigest:anchor.readbackDigest,
   hostOffDigest:hash(host.payload),independentOffDigest:hash(off.payload),
   mastersDigest:master.mastersDigest,
   exceptionCustodyDigest:exception?hash(exception.payload):null,
   ownerDecisionDigest:hash(ownerDecision.payload),
   leaseDisposition:r.leaseDisposition}));
  if(closureLedger.read('final',r.originalIncidentId)?.recordDigest!==
   final.recordDigest)throw Error('QL437_FINAL_READBACK_FAILED');
  return {...hold('SIGNED_ANCHORED_POST_SHUTDOWN_CUSTODY_RECONCILED_KEEP_HOLD'),
   state:r.exceptionEscalationRequired?
    'DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY':
    'DURABLE_QL437_OWNER_SUPERVISED_INCIDENT_CLOSURE_READBACK',
   receiver:'OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS',
   ownerAcceptance:r.exceptionEscalationRequired?
    'DUAL_SIGNED_LEASE_EXCEPTION_OPEN':
    'DUAL_SIGNED_INCIDENT_CLOSURE_NO_REENTRY',
   incidentClosed:!r.exceptionEscalationRequired,
   leaseExceptionOpen:r.exceptionEscalationRequired,
   originalIncidentId:r.originalIncidentId,nextCeremonyId:r.nextCeremonyId,
   leaseDisposition:r.leaseDisposition,
   externalAnchorDigest:anchor.anchorDigest,
   independentReadbackDigest:anchor.readbackDigest,
   pendingReceiptDigest:pending.recordDigest,
   finalReceiptDigest:final.recordDigest,masterCount:3,
   permittedNextAction:r.exceptionEscalationRequired?
    'OWNER_SUPERVISED_LEASE_EXCEPTION_REMEDIATION_NO_REENTRY':
    'NEW_SEPARATELY_AUTHORIZED_CEREMONY_REQUIRED_NO_AUTOMATIC_REENTRY'};
 }catch{return hold('QL437_FINAL_CUSTODY_COMMIT_OR_REPLAY_FAILED');}
}
