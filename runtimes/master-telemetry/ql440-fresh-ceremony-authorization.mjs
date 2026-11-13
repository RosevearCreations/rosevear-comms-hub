import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/, ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const timestamp=(x,now)=>typeof x==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x&&
 Date.parse(x)<=now&&now-Date.parse(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',activationAuthorized:false,
 receiver:'UNKNOWN_UNTIL_FRESH_INDEPENDENT_OFF_REVALIDATION',ownerAcceptance:'HOLD',
 ceremonyAuthorizationIssued:false,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signature(payload,sig,pin){
 try{
  if(typeof sig!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(sig)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(sig,'base64'));
 }catch{return false;}
}
function signedEnvelope(e,fields,pin,now){
 return exact(e,['payload','signature'])&&exact(e.payload,fields)&&
  timestamp(e.payload.observedAt??e.payload.reviewedAt??e.payload.issuedAt,now)&&
  signature(e.payload,e.signature,pin);
}
export function openQl440ProtectedCeremonyLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL440_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL440_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','issued'].includes(kind)||!ID.test(id??''))
   throw Error('QL440_INVALID_LEDGER_KEY');
  return join(root,'ql440-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;try{raw=readFileSync(file(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL440_OVERSIZE_RECORD');
  let r;try{r=JSON.parse(raw);}catch{throw Error('QL440_CORRUPT_RECORD');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!=='rosevear.ql440.original-host-ceremony-authorization-custody.v1'||
   r.kind!==kind||r.incidentId!==id||!HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:r.schema,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL440_TAMPERED_RECORD');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL440_INVALID_DIGEST');
  if(read(kind,id))throw Error('QL440_REPLAYED_INCIDENT');
  const r={schema:'rosevear.ql440.original-host-ceremony-authorization-custody.v1',
   kind,incidentId:id,evidenceDigest};
  r.recordDigest=digest(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL440_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function verifiedPrior(s,ledger){
 if(s?.state!=='DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY'||
  s.connection!=='HOLD'||s.activationAuthorized!==false||s.masterCount!==3||
  s.receiver!=='OFF_VERIFIED_POST_REMEDIATION_INDEPENDENT_READBACK'||
  s.ownerAcceptance!=='DUAL_SIGNED_NEW_CEREMONY_PREPARATION_ONLY'||
  s.permittedNextAction!=='NEW_QL429_QL430_FRESH_SEPARATELY_AUTHORIZED_ENROLLMENT_NOT_ACTIVATED'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.previousCeremonyId??'')||
  !ID.test(s.proposedCeremonyId??'')||!ID.test(s.proposedEpisodeId??'')||
  !ID.test(s.renewalNonce??'')||!HEX.test(s.renewedClosureAnchorDigest??'')||
  !HEX.test(s.independentRenewalReadbackDigest??'')||
  !HEX.test(s.pendingReceiptDigest??'')||!HEX.test(s.readinessReceiptDigest??'')||
  s.proposedCeremonyId===s.previousCeremonyId||
  typeof ledger?.read!=='function')return false;
 try{
  return ledger.read('pending',s.originalIncidentId)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read('readiness',s.originalIncidentId)?.recordDigest===s.readinessReceiptDigest;
 }catch{return false;}
}
export function prepareQl440Authorization({ql439Readiness,ql439Ledger,ceremonyNonce},
 {nowMs,protectedOriginalHostSession=false,independentQl439SourceVerified=false}={}){
 if(!protectedOriginalHostSession||!independentQl439SourceVerified||
  !ID.test(ceremonyNonce??'')||!Number.isSafeInteger(nowMs)||
  ceremonyNonce===ql439Readiness?.renewalNonce||!verifiedPrior(ql439Readiness,ql439Ledger))
  return hold('EXACT_PROTECTED_QL439_READINESS_AND_DISTINCT_NONCE_REQUIRED');
 const s=ql439Readiness;
 const request={schema:'rosevear.ql440.new-ceremony-authorization-request.v1',
  originalHostId:'DESKTOP-AE894KC',originalIncidentId:s.originalIncidentId,
  previousCeremonyId:s.previousCeremonyId,
  ceremonyId:s.proposedCeremonyId,episodeId:s.proposedEpisodeId,
  renewalNonce:s.renewalNonce,ceremonyNonce,
  ql439PendingReceiptDigest:s.pendingReceiptDigest,
  ql439ReadinessReceiptDigest:s.readinessReceiptDigest,
  ql439RenewedAnchorDigest:s.renewedClosureAnchorDigest,
  ql439IndependentReaderDigest:s.independentRenewalReadbackDigest,
  requestedAuthority:'NEW_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL440_AUTHORIZATION_REQUEST_PREPARED_ONLY',
  request,requestDigest:digest(request),connection:'HOLD',activationAuthorized:false};
}
function checkHostOff(e,r,o){
 const p=e?.payload;
 return o.independentOriginalHostPinVerified===true&&
  signedEnvelope(e,['schema','requestDigest','hostMachineId','ceremonyId',
   'episodeId','ceremonyNonce','receiverState','watchdogArmed','offSequence','observedAt'],
   o.hostOffPin,o.nowMs)&&
  p.schema==='rosevear.ql440.original-host-preauthorization-off.v1'&&
  p.requestDigest===digest(r)&&p.hostMachineId==='DESKTOP-AE894KC'&&
  p.ceremonyId===r.ceremonyId&&p.episodeId===r.episodeId&&
  p.ceremonyNonce===r.ceremonyNonce&&p.receiverState==='OFF'&&
  p.watchdogArmed===true&&Number.isSafeInteger(p.offSequence)&&p.offSequence>=1&&
  Date.parse(p.observedAt)>=Date.parse(r.preparedAt);
}
function checkIndependentOff(e,r,host,o){
 const p=e?.payload;
 return o.independentReceiverPinVerified===true&&
  signedEnvelope(e,['schema','requestDigest','ceremonyId','episodeId','ceremonyNonce',
   'hostOffDigest','receiverState','offSequence','observedAt'],o.receiverPin,o.nowMs)&&
  p.schema==='rosevear.ql440.independent-preauthorization-off.v1'&&
  p.requestDigest===digest(r)&&p.ceremonyId===r.ceremonyId&&
  p.episodeId===r.episodeId&&p.ceremonyNonce===r.ceremonyNonce&&
  p.hostOffDigest===digest(host.payload)&&p.receiverState==='OFF'&&
  Number.isSafeInteger(p.offSequence)&&p.offSequence>=host.payload.offSequence&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt);
}
function checkMasters(reports,r,off,o){
 if(o.independentMasterPinsVerified!==true||!Array.isArray(reports)||
  reports.length!==3)return null;
 const seen=new Set(),ordered=[];
 for(const e of reports){
  const p=e?.payload;
  if(!MASTERS.includes(p?.masterId)||seen.has(p.masterId)||
   !signedEnvelope(e,['schema','masterId','requestDigest','independentOffDigest',
    'decision','reviewedAt'],o.masterPins?.[p.masterId],o.nowMs)||
   p.schema!=='rosevear.ql440.three-master-activation-prerequisite.v1'||
   p.requestDigest!==digest(r)||p.independentOffDigest!==digest(off.payload)||
   p.decision!=='PREREQUISITES_ACCEPTED_NEW_CEREMONY_CHALLENGE_ONLY_NO_ON'||
   Date.parse(p.reviewedAt)<Date.parse(off.payload.observedAt))return null;
  seen.add(p.masterId);ordered.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 ordered.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {digest:digest(ordered),latestAt:Math.max(...ordered.map(p=>Date.parse(p.reviewedAt)))};
}
function checkOwners(e,r,off,masters,o){
 const p=e?.payload;
 return o.independentOwnerCustodyVerified===true&&
  o.independentReviewerCustodyVerified===true&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','requestDigest','independentOffDigest','masterDecisionDigest',
   'decision','ownerId','reviewerId','issuedAt'])&&
  p.schema==='rosevear.ql440.dual-owner-ceremony-issuance-decision.v1'&&
  p.requestDigest===digest(r)&&p.independentOffDigest===digest(off.payload)&&
  p.masterDecisionDigest===masters.digest&&
  p.decision==='ISSUE_FRESH_CEREMONY_CHALLENGE_AUTHORITY_ONLY_NO_ON'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&timestamp(p.issuedAt,o.nowMs)&&
  Date.parse(p.issuedAt)>=masters.latestAt&&
  signature(p,e.ownerSignature,o.ownerPin)&&
  signature(p,e.reviewerSignature,o.reviewerPin);
}
function checkHostIssue(e,r,off,masters,owners,o){
 const p=e?.payload;
 return o.independentOriginalHostIssuerPinVerified===true&&
  signedEnvelope(e,['schema','requestDigest','hostMachineId','ceremonyId',
   'episodeId','ceremonyNonce','independentOffDigest','masterDecisionDigest',
   'ownerDecisionDigest','authority','issuedAt'],o.hostIssuerPin,o.nowMs)&&
  p.schema==='rosevear.ql440.original-host-signed-ceremony-issuance.v1'&&
  p.requestDigest===digest(r)&&p.hostMachineId==='DESKTOP-AE894KC'&&
  p.ceremonyId===r.ceremonyId&&p.episodeId===r.episodeId&&
  p.ceremonyNonce===r.ceremonyNonce&&
  p.independentOffDigest===digest(off.payload)&&
  p.masterDecisionDigest===masters.digest&&
  p.ownerDecisionDigest===digest(owners.payload)&&
  p.authority==='FRESH_QL429_QL430_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON'&&
  Date.parse(p.issuedAt)>=Date.parse(owners.payload.issuedAt);
}
export function readQl440AuthorizationContinuity(ledger,incidentId){
 try{
  const p=ledger.read('pending',incidentId),issued=ledger.read('issued',incidentId);
  if(issued&&!p)return hold('QL440_ISSUANCE_WITHOUT_PENDING_INVALID');
  if(issued)return {...hold('PRIVATE_ISSUANCE_NOT_LIVE_RECEIVER_PROOF'),
   state:'QL440_DURABLE_PRIVATE_ISSUANCE_NEW_OFF_AND_OWNER_CHALLENGE_REQUIRED',
   pendingReceiptDigest:p.recordDigest,issuanceReceiptDigest:issued.recordDigest};
  if(p)return {...hold('QL440_PENDING_ISSUANCE_INCOMPLETE'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL440_NO_CEREMONY_ISSUANCE');
 }catch{return hold('QL440_PRIVATE_LEDGER_UNREADABLE');}
}
/** This issues *ceremony-challenge authority only*. It has no ON adapter and
 * cannot activate the receiver. CI supplies synthetic signed evidence only.
 */
export async function runQl440FreshCeremonyAuthorization({
 ql439Readiness,ql439Ledger,ceremonyNonce,authorizationLedger,
 originalHostOffAdapter,independentReceiverAdapter,masterDecisionProvider,
 ownerDecision,originalHostIssuer
},o={}){
 if(typeof authorizationLedger?.read!=='function'||
  typeof authorizationLedger?.claimOnce!=='function'||
  typeof originalHostOffAdapter?.readSignedOff!=='function'||
  typeof independentReceiverAdapter?.readSignedOff!=='function'||
  typeof masterDecisionProvider?.readSignedDecisions!=='function'||
  typeof originalHostIssuer?.issueSignedAuthorization!=='function')
  return hold('PROTECTED_AUTHORIZATION_AND_INDEPENDENT_ADAPTERS_REQUIRED');
 const prep=prepareQl440Authorization({ql439Readiness,ql439Ledger,ceremonyNonce},o);
 if(prep.state!=='QL440_AUTHORIZATION_REQUEST_PREPARED_ONLY')
  return hold('QL439_EXACT_READINESS_OR_NEW_NONCE_INVALID');
 const r=prep.request;
 const pins=[o.hostOffPin,o.receiverPin,o.ownerPin,o.reviewerPin,o.hostIssuerPin,
  ...MASTERS.map(m=>o.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string')||new Set(pins).size!==pins.length)
  return hold('DISTINCT_INDEPENDENT_ED25519_SIGNER_PINS_REQUIRED');
 try{
  if(authorizationLedger.read('pending',r.originalIncidentId)||
   authorizationLedger.read('issued',r.originalIncidentId))
   return hold('QL440_ALREADY_ATTEMPTED_ONE_USE_INCIDENT');
 }catch{return hold('QL440_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=authorizationLedger.claimOnce('pending',r.originalIncidentId,digest({
   requestDigest:prep.requestDigest,ql439ReadinessReceiptDigest:r.ql439ReadinessReceiptDigest,
   ceremonyId:r.ceremonyId,episodeId:r.episodeId,nonce:r.ceremonyNonce}));
  if(authorizationLedger.read('pending',r.originalIncidentId)?.recordDigest!==
   pending.recordDigest)throw Error('QL440_PENDING_MISMATCH');
 }catch{return hold('QL440_PENDING_CUSTODY_COMMIT_FAILED');}
 let host;
 try{host=await originalHostOffAdapter.readSignedOff({request:r,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL440_ORIGINAL_HOST_SIGNED_OFF_UNAVAILABLE');}
 if(!checkHostOff(host,r,o))return hold('QL440_ORIGINAL_HOST_OFF_OR_WATCHDOG_INVALID');
 let off;
 try{off=await independentReceiverAdapter.readSignedOff({request:r,
  hostOffDigest:digest(host.payload)});}
 catch{return hold('QL440_INDEPENDENT_OFF_UNAVAILABLE');}
 if(!checkIndependentOff(off,r,host,o))
  return hold('QL440_INDEPENDENT_OFF_SIGNATURE_OR_SEQUENCE_INVALID');
 let reports;
 try{reports=await masterDecisionProvider.readSignedDecisions({request:r,
  independentOffDigest:digest(off.payload)});}
 catch{return hold('QL440_THREE_MASTER_DECISIONS_UNAVAILABLE');}
 const masters=checkMasters(reports,r,off,o);
 if(!masters)return hold('QL440_THREE_MASTER_PREREQUISITES_REJECTED');
 if(!checkOwners(ownerDecision,r,off,masters,o))
  return hold('QL440_DUAL_OWNER_CEREMONY_AUTHORITY_REJECTED');
 let issuance;
 try{issuance=await originalHostIssuer.issueSignedAuthorization({request:r,
  independentOffDigest:digest(off.payload),masterDecisionDigest:masters.digest,
  ownerDecisionDigest:digest(ownerDecision.payload)});}
 catch{return hold('QL440_ORIGINAL_HOST_AUTHORIZATION_UNAVAILABLE');}
 if(!checkHostIssue(issuance,r,off,masters,ownerDecision,o))
  return hold('QL440_ORIGINAL_HOST_AUTHORIZATION_SIGNATURE_INVALID');
 try{
  if(!verifiedPrior(ql439Readiness,ql439Ledger)||
   authorizationLedger.read('pending',r.originalIncidentId)?.recordDigest!==
    pending.recordDigest||authorizationLedger.read('issued',r.originalIncidentId))
   return hold('QL439_OR_QL440_PRIVATE_CUSTODY_DRIFT');
  const issued=authorizationLedger.claimOnce('issued',r.originalIncidentId,digest({
   requestDigest:prep.requestDigest,pendingReceiptDigest:pending.recordDigest,
   hostOffDigest:digest(host.payload),independentOffDigest:digest(off.payload),
   masterDecisionDigest:masters.digest,ownerDecisionDigest:digest(ownerDecision.payload),
   originalHostIssuanceDigest:digest(issuance.payload)}));
  if(authorizationLedger.read('issued',r.originalIncidentId)?.recordDigest!==
   issued.recordDigest)throw Error('QL440_ISSUED_READBACK_MISMATCH');
  return {...hold('NEW_CEREMONY_AUTHORIZED_ONLY_NO_ACTIVATION'),
   state:'DURABLE_QL440_NEW_CEREMONY_AUTHORIZATION_PREREQUISITES_ACCEPTED',
   receiver:'OFF_VERIFIED_FRESH_HOST_AND_INDEPENDENT_OBSERVER',
   ownerAcceptance:'DUAL_SIGNED_CEREMONY_CHALLENGE_ISSUANCE_ONLY',
   ceremonyAuthorizationIssued:true,originalIncidentId:r.originalIncidentId,
   ceremonyId:r.ceremonyId,episodeId:r.episodeId,ceremonyNonce:r.ceremonyNonce,
   independentOffDigest:digest(off.payload),masterDecisionDigest:masters.digest,
   originalHostIssuanceDigest:digest(issuance.payload),
   pendingReceiptDigest:pending.recordDigest,
   issuanceReceiptDigest:issued.recordDigest,masterCount:3,
   permittedNextAction:'SEPARATE_PROTECTED_QL429_QL430_SUPERVISED_CHALLENGE_NO_AUTOMATIC_ON'};
 }catch{return hold('QL440_DURABLE_ISSUANCE_CUSTODY_FAILED');}
}
