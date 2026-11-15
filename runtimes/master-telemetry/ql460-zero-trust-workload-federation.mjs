import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-460: cryptographic read-only workload identity federation.
 * Proof-only, no outbound network, no secret provisioning, no receiver activation. */
export const APPS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub',
 'iCamp','yw','devilndove-site','rosiedazzlers']);
export const MASTERS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
export const TOPOLOGY='rosevear-master-shell-seven-apps.v1';
const SCHEMA='rosevear.ql460.workload-federation.v1';
const ROLES=['MASTER_CONTROLLER','MASTER_WITNESS','MASTER_COMMS','CAMPGROUND_SHELL',
 'WORKFORCE_SHELL','COMMERCE_COMPANY','DETAILING_COMPANY'];
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/,ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const exact=(v,k)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===k.length&&k.every(f=>Object.hasOwn(v,f));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now,max=60000)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=max;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',incidentStatus:'OPEN',
 activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 runtimeConnected:false,authorityTransfer:false,ownerAcceptance:'HOLD',
 physicalReceiver:'UNKNOWN_NEEDS_FRESH_INDEPENDENT_OFF'});
function sig(p,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const signed=(e,k,pin)=>exact(e,['payload','signature'])&&exact(e.payload,k)&&
 sig(e.payload,e.signature,pin);
export function openQl460FederationLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL460_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL460_UNSAFE_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL460_INVALID_CUSTODY_KEY');
  return join(root,'ql460-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const name=file(kind,id);let st;
  try{st=lstatSync(name);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4096)
   throw Error('QL460_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(name,'utf8'));}catch{throw Error('QL460_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL460_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL460_REPLAY');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL460_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
export function readQl460Federation(ledger,id){
 try{
  const p=ledger.read('pending',id),r=ledger.read('review',id),e=ledger.read('exception',id);
  if((r||e)&&(!p||(r&&e)))return hold('QL460_CONFLICTING_FINAL_CUSTODY');
  if(r)return {...hold('QL460_HISTORICAL_FEDERATION_PROOF_ONLY'),
   state:'QL460_DURABLE_SIGNED_ROUTE_REVIEW_ONLY',pendingReceiptDigest:p.recordDigest,
   finalReceiptDigest:r.recordDigest};
  if(e)return {...hold('QL460_SIGNED_REVOCATION_OR_DENIAL_OPEN'),
   state:'QL460_DURABLE_ROUTE_OR_ISSUER_EXCEPTION_OPEN',pendingReceiptDigest:p.recordDigest,
   finalReceiptDigest:e.recordDigest};
  if(p)return {...hold('QL460_MANUAL_INTERRUPTED_REVIEW_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL460_NO_REVIEW_RECEIPT');
 }catch{return hold('QL460_PRIVATE_CUSTODY_UNREADABLE');}
}
function validQl459(s,ledger){
 const denied=s?.state==='DURABLE_QL459_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN';
 const review=s?.state==='DURABLE_QL459_SOURCE_HANDOFF_REVIEW_ONLY';
 if((!denied&&!review)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||s.sourceCount!==7||
  s.ownerAcceptance!=='DUAL_SIGNED_SOURCE_HANDOFF_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.batchId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.finalReceiptDigest,s.registryDigest,s.enrollmentDigest,
   s.manifestDigest,s.masterReportsDigest].every(v=>HEX.test(v??''))||
  s.classification!==(denied?'SIGNED_PREVIOUS_EXCEPTION_OR_SOURCE_DENIAL_OPEN':
    'SIGNED_SEVEN_APP_REGISTRY_HANDOFF_REVIEW_ONLY')||
  s.closureDecision!==(denied?'ESCALATE_SIGNED_SOURCE_DENIAL_KEEP_OPEN_HOLD':
    'REVIEW_SOURCE_ENROLLMENTS_KEEP_OPEN_HOLD')||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId,kind=denied?'exception':'review';
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(kind,id)?.recordDigest===s.finalReceiptDigest&&
   !ledger.read(denied?'review':'exception',id);
 }catch{return false;}
}
const issuerFields=['schema','incidentId','batchId','challengeNonce','ql459ReceiptDigest',
 'registryDigest','appId','role','repoFullName','sourceMainSha','keyPin',
 'issuerId','credentialId','generation','priorCredentialDigest','revokedPriorPinDigest',
 'revokedPriorAt','scope','tenantBoundary','audiences','issuedAt','expiresAt',
 'issuerDisposition','authorityTransfer'];
const proofFields=['schema','incidentId','batchId','challengeNonce','ql459ReceiptDigest',
 'issuerDigest','appId','sourceMainSha','audience','tokenId','subjectId','operation',
 'tenantBoundary','scope','notBefore','expiresAt','signedAt','runtimeConnection',
 'authorityTransfer'];
const masterFields=['schema','incidentId','batchId','masterId','issuerSetDigest',
 'routeProofDigest','classification','decision','incidentStatus','attestedAt'];
const ownerFields=['schema','incidentId','batchId','sourceOwnerId','masterOwnerId',
 'issuerSetDigest','routeProofDigest','masterDigest','classification','decision',
 'incidentStatus','reviewedAt'];

export async function runQl460FederationReview({
 ql459Summary,ql459Ledger,federationLedger,batchId,challengeNonce,
 independentIssuerProvider,sevenAppWorkloadProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof federationLedger?.read!=='function'||typeof federationLedger?.claimOnce!=='function'||
  typeof independentIssuerProvider?.readSignedIssuerLifecycle!=='function'||
  typeof sevenAppWorkloadProvider?.readSignedMasterAudienceProofs!=='function'||
  typeof threeMasterProvider?.readSignedFederationVotes!=='function')
  return hold('QL460_THREE_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.independentQl459CustodyVerified||
  !opts.originalReceiverHeldAndIsolated||!opts.issuerPinsIndependentlyEnrolled||
  !opts.workloadPinsIndependentlyEnrolled||!opts.tenantPolicyVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(batchId??'')||!ID.test(challengeNonce??'')||
  challengeNonce===ql459Summary?.challengeNonce||
  !validQl459(ql459Summary,ql459Ledger))
  return hold('QL460_ORIGINAL_QL459_TRUST_AND_HOLD_REQUIRED');
 const s=ql459Summary,id=s.originalIncidentId,prior=s.finalReceiptDigest;
 const pins=[...APPS.map(a=>opts.issuerPins?.[a]),...APPS.map(a=>opts.workloadPins?.[a]),
  ...MASTERS.map(a=>opts.masterPins?.[a]),opts.sourceOwnerPin,opts.masterOwnerPin];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==19||
  opts.topology!==TOPOLOGY||
  APPS.some(a=>!SHA.test(opts.expectedMainShas?.[a]??''))||
  !HEX.test(opts.trustedRegistryDigest??'')||
  opts.trustedRegistryDigest!==s.registryDigest)
  return hold('QL460_NINETEEN_INDEPENDENT_PINS_OR_SOURCE_REGISTRY_INVALID');
 try{
  if(federationLedger.read('pending',id)||federationLedger.read('review',id)||
   federationLedger.read('exception',id))
   return hold('QL460_ONE_USE_NONCE_REPLAY');
 }catch{return hold('QL460_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=federationLedger.claimOnce('pending',id,hash({
   originalQl459SummaryDigest:hash(s),prior,batchId,challengeNonce,
   topology:TOPOLOGY,registryDigest:s.registryDigest,expectedMainShas:opts.expectedMainShas}));
  if(federationLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL460_PENDING_CUSTODY_FAILED');}
 let issuers;
 try{issuers=await independentIssuerProvider.readSignedIssuerLifecycle({
  incidentId:id,prior,batchId,challengeNonce,registryDigest:s.registryDigest});}
 catch{return hold('QL460_SIGNED_ISSUER_SOURCE_UNAVAILABLE');}
 if(!Array.isArray(issuers)||issuers.length!==7)
  return hold('QL460_SEVEN_INDEPENDENT_ISSUER_RECORDS_REQUIRED');
 const credentials=[],issuerIds=new Set(),credentialIds=new Set(),denied=[];
 for(let i=0;i<7;i++){
  const app=APPS[i],c=issuers[i]?.payload;
  if(!signed(issuers[i],issuerFields,opts.issuerPins[app])||
   c.schema!=='rosevear.ql460.issuer-lifecycle.v1'||
   c.incidentId!==id||c.batchId!==batchId||c.challengeNonce!==challengeNonce||
   c.ql459ReceiptDigest!==prior||c.registryDigest!==s.registryDigest||
   c.appId!==app||c.role!==ROLES[i]||
   c.repoFullName!=='RosevearCreations/'+app||
   c.sourceMainSha!==opts.expectedMainShas[app]||
   c.keyPin!==opts.workloadPins[app]||
   !ID.test(c.issuerId??'')||issuerIds.has(c.issuerId)||
   !ID.test(c.credentialId??'')||credentialIds.has(c.credentialId)||
   !Number.isSafeInteger(c.generation)||c.generation<2||
   !HEX.test(c.priorCredentialDigest??'')||
   !HEX.test(c.revokedPriorPinDigest??'')||
   !fresh(c.revokedPriorAt,opts.nowMs)||
   c.scope!=='SOURCE_READ_ONLY'||c.tenantBoundary!=='ISOLATED_READ_ONLY'||
   !Array.isArray(c.audiences)||c.audiences.length!==3||
   c.audiences.some((a,j)=>a!==MASTERS[j])||
   !fresh(c.issuedAt,opts.nowMs)||
   at(c.revokedPriorAt)>at(c.issuedAt)||
   !Number.isFinite(at(c.expiresAt))||at(c.expiresAt)<=at(c.issuedAt)||
   at(c.expiresAt)-at(c.issuedAt)>60000||
   !['HISTORICAL_ACTIVE_HELD','SIGNED_REVOKED_OPEN_HOLD'].includes(c.issuerDisposition)||
   c.authorityTransfer!==false)
   return hold('QL460_ISSUER_PIN_ROLE_LIFECYCLE_OR_SCOPE_DENIED');
  if(c.issuerDisposition==='SIGNED_REVOKED_OPEN_HOLD')denied.push(app);
  issuerIds.add(c.issuerId);credentialIds.add(c.credentialId);credentials.push(c);
 }
 const issuerSetDigest=hash(credentials);
 let tokens;
 try{tokens=await sevenAppWorkloadProvider.readSignedMasterAudienceProofs({
  incidentId:id,prior,batchId,challengeNonce,issuerSetDigest,audiences:[...MASTERS]});}
 catch{return hold('QL460_WORKLOAD_PROOFS_UNAVAILABLE');}
 if(!Array.isArray(tokens)||tokens.length!==21)
  return hold('QL460_TWENTYONE_DISTINCT_AUDIENCE_PROOFS_REQUIRED');
 const accepted=[],tokenIds=new Set();
 for(let i=0;i<7;i++){
  const app=APPS[i],credential=credentials[i],issuerDigest=hash(credential);
  for(let j=0;j<3;j++){
   const entry=tokens[i*3+j],p=entry?.payload,target=MASTERS[j];
   if(!signed(entry,proofFields,opts.workloadPins[app])||
    p.schema!=='rosevear.ql460.workload-proof.v1'||
    p.incidentId!==id||p.batchId!==batchId||p.challengeNonce!==challengeNonce||
    p.ql459ReceiptDigest!==prior||p.issuerDigest!==issuerDigest||
    p.appId!==app||p.sourceMainSha!==opts.expectedMainShas[app]||
    p.audience!==target||!ID.test(p.tokenId??'')||tokenIds.has(p.tokenId)||
    !ID.test(p.subjectId??'')||p.operation!=='SOURCE_READ_ONLY'||
    p.tenantBoundary!=='ISOLATED_READ_ONLY'||p.scope!=='SOURCE_READ_ONLY'||
    !Number.isFinite(at(p.notBefore))||!Number.isFinite(at(p.expiresAt))||
    at(p.expiresAt)<=at(p.notBefore)||at(p.expiresAt)-at(p.notBefore)>30000||
    !fresh(p.signedAt,opts.nowMs)||
    at(p.signedAt)<at(p.notBefore)||at(p.signedAt)>=at(p.expiresAt)||
    at(p.notBefore)<at(credential.issuedAt)||
    at(p.expiresAt)>at(credential.expiresAt)||
    p.runtimeConnection!=='UNVERIFIED_HOLD'||p.authorityTransfer!==false)
    return hold('QL460_WORKLOAD_SIGNATURE_AUDIENCE_REPLAY_OR_SCOPE_DENIED');
   tokenIds.add(p.tokenId);accepted.push(p);
  }
 }
 const routeProofDigest=hash(accepted);
 const priorException=s.state==='DURABLE_QL459_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN';
 const expired=opts.nowMs>=Math.min(...credentials.map(c=>at(c.expiresAt)),
  ...accepted.map(p=>at(p.expiresAt)));
 const exception=priorException||denied.length>0||expired;
 const classification=exception?'SIGNED_ISSUER_REVOKED_PRIOR_EXCEPTION_OR_EXPIRY_OPEN':
  'SIGNED_SEVEN_APP_TO_THREE_MASTER_READONLY_PROOF_ONLY';
 const decision=exception?'ESCALATE_ISSUER_OR_AUDIENCE_EXCEPTION_KEEP_OPEN_HOLD':
  'REVIEW_READONLY_AUDIENCE_PROOFS_KEEP_OPEN_HOLD';
 let votes;
 try{votes=await threeMasterProvider.readSignedFederationVotes({
  incidentId:id,prior,batchId,issuerSetDigest,routeProofDigest,classification,decision});}
 catch{return hold('QL460_MASTER_REVIEW_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL460_THREE_INDEPENDENT_MASTERS_REQUIRED');
 const reviewed=[],seenMasters=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seenMasters.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins?.[m.masterId])||
   m.schema!=='rosevear.ql460.master-federation-review.v1'||
   m.incidentId!==id||m.batchId!==batchId||
   m.issuerSetDigest!==issuerSetDigest||
   m.routeProofDigest!==routeProofDigest||
   m.classification!==classification||m.decision!==decision||
   m.incidentStatus!=='OPEN_HOLD'||!fresh(m.attestedAt,opts.nowMs)||
   at(m.attestedAt)<Math.max(...accepted.map(p=>at(p.signedAt))))
   return hold('QL460_THREE_MASTER_SIGNED_VETO');
  seenMasters.add(m.masterId);reviewed.push(m);
 }
 reviewed.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const masterDigest=hash(reviewed),o=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(o,ownerFields)||o.schema!=='rosevear.ql460.owner-federation.v1'||
  o.incidentId!==id||o.batchId!==batchId||
  !PERSON.test(o.sourceOwnerId??'')||!PERSON.test(o.masterOwnerId??'')||
  o.sourceOwnerId===o.masterOwnerId||o.issuerSetDigest!==issuerSetDigest||
  o.routeProofDigest!==routeProofDigest||o.masterDigest!==masterDigest||
  o.classification!==classification||o.decision!==decision||
  o.incidentStatus!=='OPEN_HOLD'||!fresh(o.reviewedAt,opts.nowMs)||
  at(o.reviewedAt)<Math.max(...reviewed.map(m=>at(m.attestedAt)))||
  !sig(o,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !sig(o,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL460_DUAL_OWNER_SIGNED_VETO');
 let commitAt;
 try{commitAt=opts.readTrustedNowMs();}
 catch{return hold('QL460_TRUSTED_COMMIT_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitAt)||commitAt<opts.nowMs||
  commitAt-opts.nowMs>60000)
  return hold('QL460_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl459(s,ql459Ledger)||
   federationLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   federationLedger.read('review',id)||federationLedger.read('exception',id)||
   !fresh(o.reviewedAt,commitAt)||
   issuers.some(e=>!fresh(e.payload.issuedAt,commitAt))||
   tokens.some(e=>!fresh(e.payload.signedAt,commitAt)))
   return hold('QL460_ORIGINAL_CUSTODY_OR_SIGNATURE_FRESHNESS_EXPIRED');
  if(!exception&&(credentials.some(c=>commitAt>=at(c.expiresAt))||
   accepted.some(p=>commitAt>=at(p.expiresAt))))
   return hold('QL460_LIVE_ATTESTATION_EXPIRED_DURING_REVIEW');
  const kind=exception?'exception':'review';
  const receipt=federationLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,batchId,challengeNonce,
   issuerSetDigest,routeProofDigest,masterDigest,ownerDigest:hash(o),
   denied,classification,decision,incidentStatus:'OPEN_HOLD'}));
  if(federationLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(exception?'HISTORICAL_REVOKED_ISSUER_OR_EXCEPTION_OPEN':
   'HISTORICAL_SIGNED_ROUTE_REVIEW_NOT_LIVE_CONNECTIVITY'),
   state:exception?'DURABLE_QL460_ROUTE_OR_ISSUER_EXCEPTION_OPEN':
    'DURABLE_QL460_SIGNED_ROUTE_REVIEW_ONLY',
   originalIncidentId:id,batchId,challengeNonce,issuerSetDigest,routeProofDigest,
   classification,decision,sourceCount:7,audienceProofCount:21,
   sourceDenials:denied.length,masterCount:3,masterDigest,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_FEDERATION_OPEN_HOLD',
   permittedNextAction:exception?'SUPERVISED_ISSUER_REENROLLMENT_REQUIRED':
    'LIVE_NETWORK_AND_TENANT_NEGATIVE_TESTS_REQUIRED'};
 }catch{return hold('QL460_DURABLE_CUSTODY_COMMIT_FAILED');}
}
