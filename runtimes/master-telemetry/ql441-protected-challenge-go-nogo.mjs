import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/, HEX=/^[a-f0-9]{64}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>Number.isSafeInteger(now)&&iso(s)&&Date.parse(s)<=now&&
 now-Date.parse(s)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,receiver:'UNKNOWN_REQUIRES_INDEPENDENT_SHUTDOWN_REVALIDATION',
 decision:'NO_GO_UNTIL_FRESH_SIGNED_EVIDENCE',manualReceiverIsolationRequired:true,
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function verifySignature(p,s,pin){
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
const signed=(e,fields,pin)=>exact(e,['payload','signature'])&&
 exact(e.payload,fields)&&verifySignature(e.payload,e.signature,pin);

export function openQl441ProtectedChallengeLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL441_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL441_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','decision'].includes(kind)||!ID.test(id??''))
   throw Error('QL441_INVALID_LEDGER_KEY');
  return join(root,'ql441-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;try{raw=readFileSync(file(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL441_OVERSIZED_RECORD');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL441_CORRUPT_RECORD');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql441.protected-challenge-decision-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))
   throw Error('QL441_TAMPERED_RECORD');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL441_INVALID_DIGEST');
  if(read(kind,id))throw Error('QL441_REPLAYED_INCIDENT');
  const rec={schema:'rosevear.ql441.protected-challenge-decision-custody.v1',
   kind,incidentId:id,evidenceDigest};rec.recordDigest=hash(rec);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)throw Error('QL441_READBACK_MISMATCH');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
function verifiedQl440(s,ledger){
 if(s?.state!=='DURABLE_QL440_NEW_CEREMONY_AUTHORIZATION_PREREQUISITES_ACCEPTED'||
  s.connection!=='HOLD'||s.activationAuthorized!==false||
  s.ceremonyAuthorizationIssued!==true||s.masterCount!==3||
  s.receiver!=='OFF_VERIFIED_FRESH_HOST_AND_INDEPENDENT_OBSERVER'||
  s.ownerAcceptance!=='DUAL_SIGNED_CEREMONY_CHALLENGE_ISSUANCE_ONLY'||
  s.permittedNextAction!=='SEPARATE_PROTECTED_QL429_QL430_SUPERVISED_CHALLENGE_NO_AUTOMATIC_ON'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.ceremonyId??'')||
  !ID.test(s.episodeId??'')||!ID.test(s.ceremonyNonce??'')||
  !HEX.test(s.independentOffDigest??'')||!HEX.test(s.masterDecisionDigest??'')||
  !HEX.test(s.originalHostIssuanceDigest??'')||
  !HEX.test(s.pendingReceiptDigest??'')||!HEX.test(s.issuanceReceiptDigest??'')||
  typeof ledger?.read!=='function')return false;
 try{
  return ledger.read('pending',s.originalIncidentId)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read('issued',s.originalIncidentId)?.recordDigest===s.issuanceReceiptDigest;
 }catch{return false;}
}
/** An authorization request is scoped to a fresh, short isolated lease.
 * No trust is inferred from prior local receipts alone. */
export function prepareQl441Challenge({
 ql440Authorization,ql440Ledger,challengeId,challengeNonce,leaseId,leaseExpiresAt
},{nowMs,protectedOriginalHostSession=false,independentQl440SourceVerified=false}={}){
 if(!protectedOriginalHostSession||!independentQl440SourceVerified||
  !Number.isSafeInteger(nowMs)||!verifiedQl440(ql440Authorization,ql440Ledger)||
  !ID.test(challengeId??'')||!ID.test(challengeNonce??'')||
  !ID.test(leaseId??'')||!iso(leaseExpiresAt)||
  challengeId===ql440Authorization?.ceremonyId||
  challengeNonce===ql440Authorization?.ceremonyNonce||
  Date.parse(leaseExpiresAt)<=nowMs||Date.parse(leaseExpiresAt)>nowMs+120000)
  return hold('EXACT_QL440_ISSUANCE_AND_FRESH_BOUNDED_LEASE_REQUIRED');
 const s=ql440Authorization;
 const request={schema:'rosevear.ql441.protected-fresh-ceremony-challenge.v1',
  originalHostId:'DESKTOP-AE894KC',originalIncidentId:s.originalIncidentId,
  ceremonyId:s.ceremonyId,episodeId:s.episodeId,ceremonyNonce:s.ceremonyNonce,
  challengeId,challengeNonce,leaseId,leaseExpiresAt,
  ql440PendingReceiptDigest:s.pendingReceiptDigest,
  ql440IssuanceReceiptDigest:s.issuanceReceiptDigest,
  ql440OriginalHostIssuanceDigest:s.originalHostIssuanceDigest,
  ql440IndependentOffDigest:s.independentOffDigest,
  ql440MasterDecisionDigest:s.masterDecisionDigest,
  requestedAction:'CONSUME_PROTECTED_CHALLENGE_AND_REVIEW_INDEPENDENT_ON_NO_CONNECT',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL441_PROTECTED_CHALLENGE_PREPARED_NO_ACTIVATION',
  request,requestDigest:hash(request),connection:'HOLD',activationAuthorized:false};
}
function verifyPriorIssuer(e,r,o){
 const p=e?.payload;
 return o.originalHostIssuerPinVerified===true&&
  signed(e,['schema','requestDigest','hostMachineId','ceremonyId',
   'episodeId','ceremonyNonce','independentOffDigest','masterDecisionDigest',
   'ownerDecisionDigest','authority','issuedAt'],o.originalHostIssuerPin)&&
  p.schema==='rosevear.ql440.original-host-signed-ceremony-issuance.v1'&&
  hash(p)===r.ql440OriginalHostIssuanceDigest&&
  p.hostMachineId==='DESKTOP-AE894KC'&&
  p.ceremonyId===r.ceremonyId&&p.episodeId===r.episodeId&&
  p.ceremonyNonce===r.ceremonyNonce&&
  p.independentOffDigest===r.ql440IndependentOffDigest&&
  p.masterDecisionDigest===r.ql440MasterDecisionDigest&&
  p.authority==='FRESH_QL429_QL430_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON'&&
  iso(p.issuedAt)&&Date.parse(p.issuedAt)<=o.nowMs;
}
function verifyOwnerPhase(e,role,r,o){
 const p=e?.payload;
 const pin=role==='source'?o.sourceOwnerPin:o.masterOwnerPin;
 return (role==='source'?o.originalSourceOwnerCustodyVerified:o.independentMasterOwnerCustodyVerified)===true&&
  signed(e,['schema','ownerRole','ownerId','requestDigest','challengeId',
   'leaseId','leaseExpiresAt','action','approvedAt'],pin)&&
  p.schema==='rosevear.ql441.separate-owner-isolated-witness-approval.v1'&&
  p.ownerRole===role&&PERSON.test(p.ownerId??'')&&
  p.requestDigest===hash(r)&&p.challengeId===r.challengeId&&
  p.leaseId===r.leaseId&&p.leaseExpiresAt===r.leaseExpiresAt&&
  p.action==='AUTHORIZE_BOUNDED_ISOLATED_ON_OBSERVATION_ONLY_NO_CONNECT'&&
  fresh(p.approvedAt,o.nowMs)&&
  Date.parse(p.approvedAt)>=Date.parse(r.preparedAt)&&
  Date.parse(p.approvedAt)<Date.parse(r.leaseExpiresAt);
}
function verifyConsumption(e,r,issue,source,master,o){
 const p=e?.payload;
 return o.originalHostConsumerPinVerified===true&&
  signed(e,['schema','requestDigest','hostMachineId','challengeId',
   'challengeNonce','leaseId','leaseExpiresAt','ql440IssuerDigest',
   'sourceOwnerDigest','masterOwnerDigest','watchdogArmed',
   'consumptionSequence','consumedAt'],o.hostConsumerPin)&&
  p.schema==='rosevear.ql441.original-host-protected-challenge-consumption.v1'&&
  p.requestDigest===hash(r)&&p.hostMachineId==='DESKTOP-AE894KC'&&
  p.challengeId===r.challengeId&&p.challengeNonce===r.challengeNonce&&
  p.leaseId===r.leaseId&&p.leaseExpiresAt===r.leaseExpiresAt&&
  p.ql440IssuerDigest===hash(issue.payload)&&
  p.sourceOwnerDigest===hash(source.payload)&&
  p.masterOwnerDigest===hash(master.payload)&&
  p.watchdogArmed===true&&Number.isSafeInteger(p.consumptionSequence)&&
  p.consumptionSequence>=1&&fresh(p.consumedAt,o.nowMs)&&
  Date.parse(p.consumedAt)>=Math.max(Date.parse(source.payload.approvedAt),
   Date.parse(master.payload.approvedAt))&&
  Date.parse(p.consumedAt)<Date.parse(r.leaseExpiresAt);
}
function verifyHostOn(e,r,consume,o){
 const p=e?.payload;
 return o.originalHostOnPinVerified===true&&
  signed(e,['schema','requestDigest','hostMachineId','challengeId',
   'challengeNonce','leaseId','leaseExpiresAt','consumptionDigest',
   'receiverState','watchdogArmed','onSequence','observedAt'],o.hostOnPin)&&
  p.schema==='rosevear.ql441.original-host-isolated-on-observation.v1'&&
  p.requestDigest===hash(r)&&p.hostMachineId==='DESKTOP-AE894KC'&&
  p.challengeId===r.challengeId&&p.challengeNonce===r.challengeNonce&&
  p.leaseId===r.leaseId&&p.leaseExpiresAt===r.leaseExpiresAt&&
  p.consumptionDigest===hash(consume.payload)&&p.receiverState==='ON'&&
  p.watchdogArmed===true&&Number.isSafeInteger(p.onSequence)&&
  p.onSequence>consume.payload.consumptionSequence&&
  fresh(p.observedAt,o.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(consume.payload.consumedAt)&&
  Date.parse(p.observedAt)<Date.parse(r.leaseExpiresAt);
}
function verifyIndependentOn(e,r,host,o){
 const p=e?.payload;
 return o.independentReceiverOnPinVerified===true&&
  signed(e,['schema','requestDigest','challengeId','challengeNonce','leaseId',
   'leaseExpiresAt','hostOnDigest','receiverState','onSequence','observedAt'],o.independentReceiverOnPin)&&
  p.schema==='rosevear.ql441.independent-isolated-receiver-on-readback.v1'&&
  p.requestDigest===hash(r)&&p.challengeId===r.challengeId&&
  p.challengeNonce===r.challengeNonce&&p.leaseId===r.leaseId&&
  p.leaseExpiresAt===r.leaseExpiresAt&&
  p.hostOnDigest===hash(host.payload)&&p.receiverState==='ON'&&
  Number.isSafeInteger(p.onSequence)&&p.onSequence>=host.payload.onSequence&&
  fresh(p.observedAt,o.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  Date.parse(p.observedAt)<Date.parse(r.leaseExpiresAt);
}
function verifyMasters(reports,r,receiver,o){
 if(o.independentMasterPinsVerified!==true||!Array.isArray(reports)||
  reports.length!==3)return null;
 const accepted=[],seen=new Set();
 for(const e of reports){
  const p=e?.payload;
  if(!MASTERS.includes(p?.masterId)||seen.has(p.masterId)||
   !signed(e,['schema','masterId','requestDigest','independentOnDigest',
    'decision','reviewedAt'],o.masterPins?.[p.masterId])||
   p.schema!=='rosevear.ql441.three-master-on-witness-decision.v1'||
   p.requestDigest!==hash(r)||p.independentOnDigest!==hash(receiver.payload)||
   !['GO_WITNESS_ACCEPTANCE_ONLY_NO_CONNECT','NO_GO_SHUTDOWN_REQUIRED'].includes(p.decision)||
   !fresh(p.reviewedAt,o.nowMs)||Date.parse(p.reviewedAt)<Date.parse(receiver.payload.observedAt)||
   Date.parse(p.reviewedAt)>=Date.parse(r.leaseExpiresAt))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {reportsDigest:hash(accepted),
  outcome:accepted.every(p=>p.decision==='GO_WITNESS_ACCEPTANCE_ONLY_NO_CONNECT')?'GO':'NO_GO',
  latestAt:Math.max(...accepted.map(p=>Date.parse(p.reviewedAt)))};
}
function verifyFinalOwners(e,r,receiver,masters,source,master,o){
 const p=e?.payload;
 const expected=masters.outcome==='GO'?
  'DUAL_OWNER_GO_ACCEPT_WITNESSED_ON_AND_REQUIRE_SHUTDOWN':
  'DUAL_OWNER_NO_GO_REQUIRE_IMMEDIATE_SHUTDOWN';
 return exact(e,['payload','sourceSignature','masterSignature'])&&
  exact(p,['schema','requestDigest','independentOnDigest','masterReportsDigest',
   'sourceOwnerDigest','masterOwnerDigest','decision','sourceOwnerId',
   'masterOwnerId','reviewedAt'])&&
  p.schema==='rosevear.ql441.dual-owner-on-witness-final-decision.v1'&&
  p.requestDigest===hash(r)&&p.independentOnDigest===hash(receiver.payload)&&
  p.masterReportsDigest===masters.reportsDigest&&
  p.sourceOwnerDigest===hash(source.payload)&&
  p.masterOwnerDigest===hash(master.payload)&&p.decision===expected&&
  p.sourceOwnerId===source.payload.ownerId&&p.masterOwnerId===master.payload.ownerId&&
  p.sourceOwnerId!==p.masterOwnerId&&fresh(p.reviewedAt,o.nowMs)&&
  Date.parse(p.reviewedAt)>=masters.latestAt&&
  Date.parse(p.reviewedAt)<Date.parse(r.leaseExpiresAt)&&
  verifySignature(p,e.sourceSignature,o.sourceOwnerPin)&&
  verifySignature(p,e.masterSignature,o.masterOwnerPin);
}
export function readQl441ChallengeContinuity(ledger,incidentId){
 try{
  const p=ledger.read('pending',incidentId),d=ledger.read('decision',incidentId);
  if(d&&!p)return hold('QL441_DECISION_WITHOUT_PENDING_INVALID');
  if(d)return {...hold('SIGNED_DECISION_NOT_CURRENT_RECEIVER_STATE'),
   state:'QL441_PRIVATE_DECISION_FRESH_OFF_AND_LEASE_CLOSEOUT_REQUIRED',
   pendingReceiptDigest:p.recordDigest,decisionReceiptDigest:d.recordDigest};
  if(p)return {...hold('QL441_PENDING_CONSUMPTION_UNRESOLVED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL441_NO_CHALLENGE_RECORD');
 }catch{return hold('QL441_PROTECTED_LEDGER_UNREADABLE');}
}
/** Read-only evidence verifier. It never invokes receiver ON/OFF actions.
 * Witnessed ON requires a separate, authorized physical ceremony and signed
 * eventual OFF shutdown. A GO decision is not permission to remain ON. */
export async function runQl441ProtectedChallenge({
 ql440Authorization,ql440Ledger,challengeId,challengeNonce,leaseId,
 leaseExpiresAt,challengeLedger,originalIssuerProvider,ownerApprovals,
 originalHostConsumer,originalHostOnProvider,independentOnProvider,
 masterDecisionProvider,finalOwnerDecision
},o={}){
 if(typeof challengeLedger?.read!=='function'||typeof challengeLedger?.claimOnce!=='function'||
  typeof originalIssuerProvider?.readSignedIssuance!=='function'||
  typeof originalHostConsumer?.readSignedConsumption!=='function'||
  typeof originalHostOnProvider?.readSignedOn!=='function'||
  typeof independentOnProvider?.readSignedOn!=='function'||
  typeof masterDecisionProvider?.readSignedDecisions!=='function')
  return hold('QL441_PROTECTED_READONLY_ADAPTERS_REQUIRED');
 const prep=prepareQl441Challenge({ql440Authorization,ql440Ledger,
  challengeId,challengeNonce,leaseId,leaseExpiresAt},o);
 if(prep.state!=='QL441_PROTECTED_CHALLENGE_PREPARED_NO_ACTIVATION')
  return hold('QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
 const r=prep.request;
 const pins=[o.originalHostIssuerPin,o.sourceOwnerPin,o.masterOwnerPin,
  o.hostConsumerPin,o.hostOnPin,o.independentReceiverOnPin,
  ...MASTERS.map(m=>o.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string')||new Set(pins).size!==pins.length)
  return hold('QL441_INDEPENDENT_SIGNER_CUSTODY_REQUIRED');
 const {source,master}=ownerApprovals??{};
 if(!verifyOwnerPhase(source,'source',r,o)||!verifyOwnerPhase(master,'master',r,o)||
  source.payload.ownerId===master.payload.ownerId)
  return hold('QL441_SEPARATE_SIGNED_OWNER_APPROVALS_REQUIRED');
 try{
  if(challengeLedger.read('pending',r.originalIncidentId)||
   challengeLedger.read('decision',r.originalIncidentId))
   return hold('QL441_ONE_USE_INCIDENT_ALREADY_CONSUMED');
 }catch{return hold('QL441_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=challengeLedger.claimOnce('pending',r.originalIncidentId,hash({
   requestDigest:prep.requestDigest,issuedReceiptDigest:r.ql440IssuanceReceiptDigest,
   sourceOwnerDigest:hash(source.payload),masterOwnerDigest:hash(master.payload)}));
  if(challengeLedger.read('pending',r.originalIncidentId)?.recordDigest!==pending.recordDigest)
   throw Error('QL441_PENDING_READBACK_FAILED');
 }catch{return hold('QL441_PENDING_CUSTODY_FAILED');}
 let issue;
 try{issue=await originalIssuerProvider.readSignedIssuance({
  request:r,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL441_QL440_SIGNED_ORIGINAL_ISSUANCE_UNAVAILABLE');}
 if(!verifyPriorIssuer(issue,r,o))return hold('QL441_QL440_ORIGINAL_ISSUER_INVALID');
 let consume;
 try{consume=await originalHostConsumer.readSignedConsumption({request:r,
  issuerDigest:hash(issue.payload),sourceOwnerDigest:hash(source.payload),
  masterOwnerDigest:hash(master.payload)});}
 catch{return hold('QL441_ORIGINAL_HOST_CONSUMPTION_UNAVAILABLE');}
 if(!verifyConsumption(consume,r,issue,source,master,o))
  return hold('QL441_PROTECTED_HOST_CONSUMPTION_INVALID');
 let host;
 try{host=await originalHostOnProvider.readSignedOn({request:r,
  consumptionDigest:hash(consume.payload)});}
 catch{return hold('QL441_ORIGINAL_HOST_ON_WITNESS_UNAVAILABLE');}
 if(!verifyHostOn(host,r,consume,o))return hold('QL441_ORIGINAL_HOST_ON_LEASE_INVALID');
 let receiver;
 try{receiver=await independentOnProvider.readSignedOn({request:r,
  hostOnDigest:hash(host.payload)});}
 catch{return hold('QL441_INDEPENDENT_ON_WITNESS_UNAVAILABLE');}
 if(!verifyIndependentOn(receiver,r,host,o))
  return hold('QL441_INDEPENDENT_ON_WITNESS_OR_LEASE_INVALID');
 let reports;
 try{reports=await masterDecisionProvider.readSignedDecisions({request:r,
  independentOnDigest:hash(receiver.payload)});}
 catch{return hold('QL441_THREE_MASTER_ON_DECISION_UNAVAILABLE');}
 const masters=verifyMasters(reports,r,receiver,o);
 if(!masters)return hold('QL441_SIGNED_THREE_MASTER_ON_DECISION_REJECTED');
 if(!verifyFinalOwners(finalOwnerDecision,r,receiver,masters,source,master,o))
  return hold('QL441_FINAL_DUAL_OWNER_ON_DECISION_REJECTED');
 try{
  if(!verifiedQl440(ql440Authorization,ql440Ledger)||
   challengeLedger.read('pending',r.originalIncidentId)?.recordDigest!==pending.recordDigest||
   challengeLedger.read('decision',r.originalIncidentId)||
   o.nowMs>=Date.parse(r.leaseExpiresAt))
   return hold('QL441_QL440_CUSTODY_OR_LEASE_CHANGED');
  const final=challengeLedger.claimOnce('decision',r.originalIncidentId,hash({
   requestDigest:prep.requestDigest,pendingReceiptDigest:pending.recordDigest,
   issuerDigest:hash(issue.payload),consumptionDigest:hash(consume.payload),
   hostOnDigest:hash(host.payload),independentOnDigest:hash(receiver.payload),
   masterReportsDigest:masters.reportsDigest,
   finalOwnerDecisionDigest:hash(finalOwnerDecision.payload),outcome:masters.outcome}));
  if(challengeLedger.read('decision',r.originalIncidentId)?.recordDigest!==final.recordDigest)
   throw Error('QL441_FINAL_READBACK_FAILED');
  return {...hold('SIGNED_ON_WITNESS_DECISION_SHUTDOWN_STILL_REQUIRED'),
   state:masters.outcome==='GO'?'DURABLE_QL441_GO_WITNESSED_ON_REVIEW_ONLY':
    'DURABLE_QL441_NO_GO_WITNESSED_ON_SHUTDOWN_REQUIRED',
   decision:masters.outcome==='GO'?'GO_WITNESS_ACCEPTANCE_ONLY':'NO_GO_SHUTDOWN_REQUIRED',
   receiver:'ON_WITNESSED_ISOLATED_LEASE_SHUTDOWN_REQUIRED',
   originalIncidentId:r.originalIncidentId,challengeId,leaseId,leaseExpiresAt,
   independentOnDigest:hash(receiver.payload),masterReportsDigest:masters.reportsDigest,
   pendingReceiptDigest:pending.recordDigest,decisionReceiptDigest:final.recordDigest,
   masterCount:3,permittedNextAction:'SIGNED_ISOLATED_SHUTDOWN_AND_INDEPENDENT_OFF_RECONCILIATION_ONLY'};
 }catch{return hold('QL441_PROTECTED_FINAL_DECISION_CUSTODY_FAILED');}
}
