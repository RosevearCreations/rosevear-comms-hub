import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-459: signed historical-only schema, controller-issued certificates,
 * independently ACKed signers, source handoff and owner veto. Never CONNECTED. */
export const QL459_APPS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub',
 'iCamp','yw','devilndove-site','rosiedazzlers']);
export const QL459_ROLES=Object.freeze(['MASTER_CONTROLLER','MASTER_WITNESS','MASTER_COMMS',
 'CAMPGROUND_SHELL','WORKFORCE_SHELL','COMMERCE_COMPANY','DETAILING_COMPANY']);
export const QL459_MASTERS=Object.freeze(['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform']);
export const QL459_REGISTRY=Object.freeze({
 topology:'rosevear-master-shell-seven-apps.v1',version:1,
 orderedApps:QL459_APPS,roles:QL459_ROLES,
 tiers:['TRUST_ROOT','WORKLOAD_AUTH','TENANT_POLICY','DATA_PRIVACY',
  'EVENT_INTEGRITY','OWNER_VETO','RELEASE_ASSURANCE'],
 permittedOperations:['SOURCE_READ_ONLY'],tenantPolicy:'DENY_CROSS_TENANT',
 authorityTransfer:false,originalReceiver:'OPEN_HOLD'
});
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/,SCHEMA='rosevear.ql459.registry-enrollment-handoff.v1';
const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
export const QL459_REGISTRY_FINGERPRINT=digest(QL459_REGISTRY);
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(f=>Object.hasOwn(o,f));
const time=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const fresh=(s,now,limit=60000)=>Number.isSafeInteger(now)&&
 Number.isFinite(time(s))&&time(s)<=now&&now-time(s)<=limit;
const HOLD=reason=>({state:'HOLD',reason,connection:'HOLD',incidentStatus:'OPEN',
 activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 authorityTransfer:false,runtimeConnected:false,
 receiver:'UNKNOWN_REQUIRES_INDEPENDENT_PHYSICAL_OFF',ownerAcceptance:'HOLD'});
function verifySig(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return false;
  const k=createPublicKey({key:b,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),k,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const signed=(env,fields,pin)=>exact(env,['payload','signature'])&&
 exact(env.payload,fields)&&verifySig(env.payload,env.signature,pin);

export function openQl459RegistryLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL459_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL459_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL459_INVALID_RECORD_KEY');
  return join(root,'ql459-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const path=file(kind,id);let st;
  try{st=lstatSync(path);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4096)
   throw Error('QL459_UNSAFE_RECEIPT');
  let r;
  try{r=JSON.parse(readFileSync(path,'utf8'));}catch{throw Error('QL459_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL459_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL459_DUPLICATE_CLAIM');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=digest(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL459_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl458(s,ledger){
 const exception=s?.state==='DURABLE_QL458_SLA_OR_PROVENANCE_EXCEPTION_OPEN';
 const review=s?.state==='DURABLE_QL458_SEVEN_APP_PROVENANCE_REVIEW_ONLY';
 if((!review&&!exception)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  s.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.monitorId??'')||
  !ID.test(s.challengeNonce??'')||s.sourceCount!==7||
  !Number.isSafeInteger(s.sourceDenials)||s.sourceDenials<0||s.sourceDenials>7||
  !HEX.test(s.sourceManifestDigest??'')||
  ![s.pendingReceiptDigest,s.finalReceiptDigest,s.monitorDigest,s.gateDigest,
    s.reportsDigest].every(x=>HEX.test(x??''))||
  s.classification!==(exception?'SIGNED_SLA_DRIFT_OR_SEVEN_APP_SOURCE_EXCEPTION_OPEN':
    'SIGNED_MULTIHORIZON_SLA_CEREMONY_AND_SEVEN_APP_SOURCE_REVIEW_ONLY')||
  s.closureDecision!==(exception?'ESCALATE_SLA_OR_SOURCE_DRIFT_KEEP_OPEN_HOLD':
    'RENEW_THREE_MASTER_SOURCE_PROVENANCE_KEEP_OPEN_HOLD')||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId,kind=exception?'exception':'review';
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(kind,id)?.recordDigest===s.finalReceiptDigest&&
   !ledger.read(exception?'review':'exception',id);
 }catch{return false;}
}
export function readQl459Registry(ledger,incidentId){
 try{
  const p=ledger.read('pending',incidentId),r=ledger.read('review',incidentId),
   e=ledger.read('exception',incidentId);
  if((r||e)&&(!p||(r&&e)))return HOLD('QL459_CONFLICTING_CUSTODY');
  if(r)return {...HOLD('QL459_HISTORICAL_READONLY_PROOF_ONLY'),
   state:'QL459_DURABLE_SOURCE_HANDOFF_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:r.recordDigest};
  if(e)return {...HOLD('QL459_DENIAL_OR_PRIOR_EXCEPTION_OPEN'),
   state:'QL459_DURABLE_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:e.recordDigest};
  if(p)return {...HOLD('QL459_MANUAL_INTERRUPTED_CUSTODY_REVIEW_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return HOLD('QL459_NO_RECEIPT');
 }catch{return HOLD('QL459_PRIVATE_CUSTODY_UNREADABLE');}
}
const registryFields=['schema','batchId','incidentId','challengeNonce','priorReceiptDigest',
 'registryFingerprint','controllerSha','contract','issuedAt','expiresAt','status'];
const certFields=['schema','batchId','incidentId','challengeNonce','registryDigest','appId',
 'appRole','repoFullName','mainSha','controllerSha','keyPin','certificateId',
 'generation','previousEnrollmentDigest','scope','audience','tenantBoundary',
 'authorityTransfer','issuedAt','expiresAt'];
const ackFields=['schema','batchId','incidentId','challengeNonce','appId',
 'certificateDigest','acknowledgedAt','ackState','runtimeConnection'];
const manifestFields=['schema','batchId','incidentId','challengeNonce','appId',
 'repoFullName','mainSha','registryDigest','certificateDigest','sourceManifestDigest',
 'tenantBoundary','sourceScope','privilegedScope','authorityTransfer','sourceStatus',
 'runtimeConnection','sourceReadAt'];
const masterFields=['schema','batchId','incidentId','masterId','registryDigest',
 'enrollmentDigest','manifestDigest','classification','closureDecision','incidentStatus',
 'reviewedAt'];
const ownerFields=['schema','batchId','incidentId','sourceOwnerId','masterOwnerId',
 'registryDigest','enrollmentDigest','manifestDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

export async function runQl459RegistryReview({
 ql458Summary,ql458Ledger,registryLedger,batchId,challengeNonce,
 controllerRegistryProvider,controllerEnrollmentProvider,sevenAppManifestProvider,
 threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof registryLedger?.read!=='function'||typeof registryLedger?.claimOnce!=='function'||
  typeof controllerRegistryProvider?.readSignedRegistry!=='function'||
  typeof controllerEnrollmentProvider?.readSignedEnrollmentCertificates!=='function'||
  typeof sevenAppManifestProvider?.readSignedSourceHandoff!=='function'||
  typeof threeMasterProvider?.readSignedHandoffVotes!=='function')
  return HOLD('QL459_FOUR_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.originalHostHoldVerified||
  !opts.independentQl458CustodyVerified||!opts.preEnrolledPinsVerified||
  !opts.controllerSourceVerified||!opts.tenantBoundaryVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(batchId??'')||!ID.test(challengeNonce??'')||
  challengeNonce===ql458Summary?.challengeNonce||
  !validQl458(ql458Summary,ql458Ledger)||
  opts.trustedRegistryFingerprint!==QL459_REGISTRY_FINGERPRINT)
  return HOLD('QL459_INDEPENDENT_PREDECESSOR_AND_TRUST_ROOT_REQUIRED');
 const id=ql458Summary.originalIncidentId,prior=ql458Summary.finalReceiptDigest;
 const pins=[...QL459_APPS.map(a=>opts.appPins?.[a]),
  ...QL459_MASTERS.map(m=>opts.masterPins?.[m]),
  opts.sourceOwnerPin,opts.masterOwnerPin];
 if(pins.some(p=>typeof p!=='string'||!p)||
  new Set(pins).size!==12||
  opts.controllerPin!==opts.appPins?.['ai-data-platform']||
  QL459_APPS.some(a=>!SHA.test(opts.expectedMainShas?.[a]??''))||
  opts.controllerSha!==opts.expectedMainShas['ai-data-platform'])
  return HOLD('QL459_TWELVE_DISTINCT_TRUST_PINS_AND_EXACT_SOURCE_SHAS_REQUIRED');
 try{
  if(registryLedger.read('pending',id)||registryLedger.read('review',id)||
   registryLedger.read('exception',id))
   return HOLD('QL459_ONE_USE_BATCH_ALREADY_ATTEMPTED');
 }catch{return HOLD('QL459_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=registryLedger.claimOnce('pending',id,digest({
   prior,priorSummaryDigest:digest(ql458Summary),batchId,challengeNonce,
   registryFingerprint:QL459_REGISTRY_FINGERPRINT,controllerSha:opts.controllerSha}));
  if(registryLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return HOLD('QL459_PROTECTED_PENDING_CLAIM_FAILED');}
 let registry;
 try{registry=await controllerRegistryProvider.readSignedRegistry({
  incidentId:id,prior,batchId,challengeNonce,pendingDigest:pending.recordDigest});}
 catch{return HOLD('QL459_CONTROLLER_REGISTRY_UNAVAILABLE');}
 const g=registry?.payload;
 if(!signed(registry,registryFields,opts.controllerPin)||
  g.schema!=='rosevear.ql459.controller-registry.v1'||
  g.batchId!==batchId||g.incidentId!==id||g.challengeNonce!==challengeNonce||
  g.priorReceiptDigest!==prior||
  g.registryFingerprint!==QL459_REGISTRY_FINGERPRINT||
  g.controllerSha!==opts.controllerSha||
  JSON.stringify(g.contract)!==JSON.stringify(QL459_REGISTRY)||
  g.status!=='SOURCE_ONLY_HOLD'||
  !fresh(g.issuedAt,opts.nowMs)||!Number.isFinite(time(g.expiresAt))||
  time(g.expiresAt)<=time(g.issuedAt)||
  time(g.expiresAt)-time(g.issuedAt)>60000)
  return HOLD('QL459_CONTROLLER_SIGNATURE_OR_CANONICAL_SCHEMA_INVALID');
 const registryDigest=digest(g);
 let entries;
 try{entries=await controllerEnrollmentProvider.readSignedEnrollmentCertificates({
  incidentId:id,prior,batchId,challengeNonce,registryDigest});}
 catch{return HOLD('QL459_CONTROLLER_ENROLLMENT_UNAVAILABLE');}
 if(!Array.isArray(entries)||entries.length!==7)
  return HOLD('QL459_SEVEN_CONTROLLER_CERTIFICATES_AND_ACKS_REQUIRED');
 const accepted=[],certDigests=[],seenCertificateIds=new Set();
 for(let i=0;i<7;i++){
  const app=QL459_APPS[i],item=entries[i],c=item?.certificate?.payload,
   a=item?.acceptance?.payload,expSha=opts.expectedMainShas[app];
  if(!exact(item,['certificate','acceptance'])||
   !signed(item.certificate,certFields,opts.controllerPin)||
   !signed(item.acceptance,ackFields,opts.appPins[app])||
   c.schema!=='rosevear.ql459.enrollment-certificate.v1'||
   c.batchId!==batchId||c.incidentId!==id||
   c.challengeNonce!==challengeNonce||c.registryDigest!==registryDigest||
   c.appId!==app||c.appRole!==QL459_ROLES[i]||
   c.repoFullName!=='RosevearCreations/'+app||c.mainSha!==expSha||
   c.controllerSha!==opts.controllerSha||c.keyPin!==opts.appPins[app]||
   !ID.test(c.certificateId??'')||seenCertificateIds.has(c.certificateId)||
   !Number.isSafeInteger(c.generation)||c.generation<2||
   !HEX.test(c.previousEnrollmentDigest??'')||
   c.scope!=='SOURCE_READ_ONLY'||c.audience!==app||
   c.tenantBoundary!=='ISOLATED_READ_ONLY'||c.authorityTransfer!==false||
   !fresh(c.issuedAt,opts.nowMs)||!Number.isFinite(time(c.expiresAt))||
   time(c.expiresAt)<=time(c.issuedAt)||
   time(c.expiresAt)-time(c.issuedAt)>60000||
   a.schema!=='rosevear.ql459.enrollment-ack.v1'||
   a.batchId!==batchId||a.incidentId!==id||
   a.challengeNonce!==challengeNonce||a.appId!==app||
   a.certificateDigest!==digest(c)||
   !fresh(a.acknowledgedAt,opts.nowMs)||
   time(a.acknowledgedAt)<time(c.issuedAt)||
   a.ackState!=='SIGNED_ACK_HELD'||
   a.runtimeConnection!=='UNVERIFIED_HOLD')
   return HOLD('QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
  seenCertificateIds.add(c.certificateId);certDigests.push(digest(c));accepted.push(c);
 }
 const enrollmentDigest=digest(certDigests);
 let manifests;
 try{manifests=await sevenAppManifestProvider.readSignedSourceHandoff({
  incidentId:id,prior,batchId,challengeNonce,registryDigest,enrollmentDigest,
  expectedMainShas:{...opts.expectedMainShas}});}
 catch{return HOLD('QL459_SOURCE_HANDOFF_UNAVAILABLE');}
 if(!Array.isArray(manifests)||manifests.length!==7)
  return HOLD('QL459_SEVEN_SOURCE_MANIFESTS_REQUIRED');
 const records=[];let denied=0;
 for(let i=0;i<7;i++){
  const app=QL459_APPS[i],m=manifests[i]?.payload;
  if(!signed(manifests[i],manifestFields,opts.appPins[app])||
   m.schema!=='rosevear.ql459.source-handoff.v1'||
   m.batchId!==batchId||m.incidentId!==id||
   m.challengeNonce!==challengeNonce||m.appId!==app||
   m.repoFullName!=='RosevearCreations/'+app||
   m.mainSha!==opts.expectedMainShas[app]||
   m.registryDigest!==registryDigest||
   m.certificateDigest!==certDigests[i]||
   !HEX.test(m.sourceManifestDigest??'')||
   m.tenantBoundary!=='ISOLATED_READ_ONLY'||
   m.sourceScope!=='SOURCE_READ_ONLY'||m.privilegedScope!==false||
   m.authorityTransfer!==false||
   !['SIGNED_SOURCE_HELD','DENIED_SOURCE'].includes(m.sourceStatus)||
   m.runtimeConnection!=='UNVERIFIED_HOLD'||
   !fresh(m.sourceReadAt,opts.nowMs)||
   time(m.sourceReadAt)<time(entries[i].acceptance.payload.acknowledgedAt))
   return HOLD('QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
  records.push(m);
  if(m.sourceStatus==='DENIED_SOURCE')denied++;
 }
 const manifestDigest=digest(records);
 const priorException=ql458Summary.state==='DURABLE_QL458_SLA_OR_PROVENANCE_EXCEPTION_OPEN';
 const exception=priorException||denied>0||opts.nowMs>=time(g.expiresAt)||
  entries.some(e=>opts.nowMs>=time(e.certificate.payload.expiresAt));
 const classification=exception?'SIGNED_PREVIOUS_EXCEPTION_OR_SOURCE_DENIAL_OPEN':
  'SIGNED_SEVEN_APP_REGISTRY_HANDOFF_REVIEW_ONLY';
 const closureDecision=exception?'ESCALATE_SIGNED_SOURCE_DENIAL_KEEP_OPEN_HOLD':
  'REVIEW_SOURCE_ENROLLMENTS_KEEP_OPEN_HOLD';
 let votes;
 try{votes=await threeMasterProvider.readSignedHandoffVotes({
  incidentId:id,prior,batchId,registryDigest,enrollmentDigest,
  manifestDigest,classification,closureDecision});}
 catch{return HOLD('QL459_THREE_MASTER_HANDBACK_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return HOLD('QL459_THREE_SIGNED_MASTERS_REQUIRED');
 const reports=[],seenMasters=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!QL459_MASTERS.includes(m?.masterId)||seenMasters.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins?.[m.masterId])||
   m.schema!=='rosevear.ql459.master-review.v1'||
   m.batchId!==batchId||m.incidentId!==id||
   m.registryDigest!==registryDigest||
   m.enrollmentDigest!==enrollmentDigest||
   m.manifestDigest!==manifestDigest||
   m.classification!==classification||m.closureDecision!==closureDecision||
   m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||
   time(m.reviewedAt)<Math.max(...manifests.map(x=>time(x.payload.sourceReadAt))))
   return HOLD('QL459_INDEPENDENT_THREE_MASTER_VETO');
  seenMasters.add(m.masterId);reports.push(m);
 }
 reports.sort((a,b)=>QL459_MASTERS.indexOf(a.masterId)-QL459_MASTERS.indexOf(b.masterId));
 const masterReportsDigest=digest(reports),o=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(o,ownerFields)||o.schema!=='rosevear.ql459.dual-owner-handoff.v1'||
  o.batchId!==batchId||o.incidentId!==id||
  !PERSON.test(o.sourceOwnerId??'')||!PERSON.test(o.masterOwnerId??'')||
  o.sourceOwnerId===o.masterOwnerId||
  o.registryDigest!==registryDigest||
  o.enrollmentDigest!==enrollmentDigest||o.manifestDigest!==manifestDigest||
  o.masterReportsDigest!==masterReportsDigest||
  o.classification!==classification||o.closureDecision!==closureDecision||
  o.incidentStatus!=='OPEN_HOLD'||
  !fresh(o.reviewedAt,opts.nowMs)||
  time(o.reviewedAt)<Math.max(...reports.map(x=>time(x.reviewedAt)))||
  !verifySig(o,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(o,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return HOLD('QL459_DISTINCT_DUAL_OWNER_VETO');
 let finalNow;
 try{finalNow=opts.readTrustedNowMs();}
 catch{return HOLD('QL459_TRUSTED_FINAL_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(finalNow)||finalNow<opts.nowMs||
  finalNow-opts.nowMs>60000)return HOLD('QL459_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl458(ql458Summary,ql458Ledger)||
   registryLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   registryLedger.read('review',id)||registryLedger.read('exception',id)||
   !fresh(g.issuedAt,finalNow)||
   entries.some(e=>!fresh(e.acceptance.payload.acknowledgedAt,finalNow))||
   manifests.some(e=>!fresh(e.payload.sourceReadAt,finalNow))||
   !fresh(o.reviewedAt,finalNow))
   return HOLD('QL459_PROTECTED_CUSTODY_OR_SIGNED_SOURCE_STALE');
  if(!exception&&(finalNow>=time(g.expiresAt)||
     entries.some(e=>finalNow>=time(e.certificate.payload.expiresAt))))
   return HOLD('QL459_ENROLLMENT_EXPIRED_DURING_COMMIT');
  const kind=exception?'exception':'review';
  const receipt=registryLedger.claimOnce(kind,id,digest({
   prior,pendingDigest:pending.recordDigest,batchId,challengeNonce,registryDigest,
   enrollmentDigest,manifestDigest,masterReportsDigest,ownerDigest:digest(o),
   classification,closureDecision,sourceDenials:denied,incidentStatus:'OPEN_HOLD'}));
  if(registryLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...HOLD(exception?'SOURCE_DENIED_OR_PRIOR_EXCEPTION_REQUIRES_INDEPENDENT_REVIEW':
    'HISTORICAL_READONLY_SOURCE_HANDOFF_REVIEW_ONLY'),
   state:exception?'DURABLE_QL459_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN':
    'DURABLE_QL459_SOURCE_HANDOFF_REVIEW_ONLY',
   originalIncidentId:id,batchId,challengeNonce,registryDigest,enrollmentDigest,
   manifestDigest,masterReportsDigest,sourceCount:7,sourceDenials:denied,
   classification,closureDecision,masterCount:3,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_SOURCE_HANDOFF_OPEN_HOLD',
   permittedNextAction:exception?'SUPERVISED_SOURCE_REMEDIATION_REQUIRED':
    'INDEPENDENT_APPLICATION_RUNTIME_ACCEPTANCE_REQUIRED'};
 }catch{return HOLD('QL459_DURABLE_COMMIT_FAILED');}
}
