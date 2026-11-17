import {createCipheriv,createDecipheriv,createHash,createHmac,createPublicKey,randomBytes,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {SOURCE_IDS} from './ql461-protocol11-tenant-policy.mjs';

/**
 * QL-465: private, OFFLINE ONLY privacy protection primitives.
 * Nothing in this module sends messages, exports a record, deletes customer
 * data, enables a peer receiver or makes a cross-application database call.
 */
export const QL465_SCHEMA='rosevear.ql465.privacy-custody.v1';
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const HEX=/^[a-f0-9]{64}$/;
const allowedPurposes=Object.freeze(['marketing_sms','marketing_email','call_recording','ai_processing','customer_support']);
const allowedCategories=Object.freeze(['CONSENT_REVIEW','EVIDENCE_REVIEW','RETENTION_REVIEW','REQUEST_REVIEW']);
const piiFields=Object.freeze(['name','email','phone','postalAddress','messageText']);
const exact=(obj,fields)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===fields.length&&fields.every(k=>Object.hasOwn(obj,k));
const digest=(v)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const safeTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const fresh=(s,now)=>Number.isSafeInteger(now)&&Number.isFinite(safeTime(s))&&
 safeTime(s)<=now&&now-safeTime(s)<=300000;
const hold=(reason)=>({state:'HOLD',reason,connection:'HOLD',runtimeConnected:false,
 dataExported:false,dataDeleted:false,providerNotified:false,consentRestored:false,
 retentionExecuted:false,liveDispatchAuthorized:false,authorityTransfer:false});
const scopeValid=(s)=>s&&ID.test(s.tenantId??'')&&ID.test(s.workspaceId??'')&&ID.test(s.subjectRef??'')&&allowedPurposes.includes(s.purpose);

export function projectQl465NonpersonalEvent({event,expectedTenantId,expectedWorkspaceId,nowMs}={}){
 const fields=['schema','eventId','sourceId','tenantId','workspaceId','subjectRef',
  'purpose','category','evidenceDigest','issuedAt','privateDataIncluded','authorityTransfer'];
 if(!exact(event,fields)||event.schema!==QL465_SCHEMA||!ID.test(event.eventId??'')||
  !SOURCE_IDS.includes(event.sourceId)||!scopeValid(event)||
  event.tenantId!==expectedTenantId||event.workspaceId!==expectedWorkspaceId||
  !allowedCategories.includes(event.category)||!HEX.test(event.evidenceDigest??'')||
  event.privateDataIncluded!==false||event.authorityTransfer!==false||
  !fresh(event.issuedAt,nowMs))
  return hold('QL465_TENANT_PROJECTION_OR_SOURCE_DENIED');
 // Strict input-field allowlist: no message, name, address, metadata bag or PII.
 // This is a local unsigned projection, NOT a source-authentication receipt.
 return {...hold('QL465_LOCAL_NONPERSONAL_PROJECTION_ONLY'),
  state:'NONPERSONAL_REVIEW_ONLY',projection:{
   schema:QL465_SCHEMA,eventId:event.eventId,sourceId:event.sourceId,
   tenantId:event.tenantId,workspaceId:event.workspaceId,
   subjectRefDigest:digest([event.tenantId,event.workspaceId,event.subjectRef]),
   purpose:event.purpose,category:event.category,evidenceDigest:event.evidenceDigest,
   issuedAt:event.issuedAt,dataClass:'NONPERSONAL_REVIEW',
   signedSourceVerified:false
  }};
}

const encryptionContext=(o)=>({
 schema:QL465_SCHEMA,tenantId:o.tenantId,workspaceId:o.workspaceId,
 recordId:o.recordId,purpose:o.purpose
});
const contextValid=(o)=>o&&ID.test(o.tenantId??'')&&ID.test(o.workspaceId??'')&&
 ID.test(o.recordId??'')&&allowedPurposes.includes(o.purpose);
function requireKey(key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('QL465_32_BYTE_SECRET_REQUIRED');
}
function validPiiRecord(record){
 return record!==null&&typeof record==='object'&&!Array.isArray(record)&&
 Object.keys(record).length>0&&Object.keys(record).every(k=>piiFields.includes(k)&&
  typeof record[k]==='string'&&record[k].trim().length>0&&Buffer.byteLength(record[k],'utf8')<=512);
}
export function encryptQl465Pii({record,key,tenantId,workspaceId,recordId,purpose}={}){
 requireKey(key);
 const ctx={tenantId,workspaceId,recordId,purpose};
 if(!contextValid(ctx)||!validPiiRecord(record))
  throw Error('QL465_PII_FIELD_OR_CONTEXT_DENIED');
 const iv=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from(JSON.stringify(encryptionContext(ctx))));
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(record),'utf8'),cipher.final()]);
 return Object.freeze({...encryptionContext(ctx),dataClass:'ENCRYPTED_PII_LOCAL_ONLY',
  algorithm:'AES-256-GCM',iv:iv.toString('base64'),ciphertext:encrypted.toString('base64'),
  tag:cipher.getAuthTag().toString('base64'),dataExported:false});
}
export function decryptQl465Pii({packet,key,tenantId,workspaceId,recordId,purpose,ownerApproved=false,role}={}){
 if(!ownerApproved||role!=='tenant_privacy_owner')return hold('QL465_OWNER_ROLE_REQUIRED');
 const ctx={tenantId,workspaceId,recordId,purpose};
 if(!contextValid(ctx)||!exact(packet,['schema','tenantId','workspaceId','recordId',
  'purpose','dataClass','algorithm','iv','ciphertext','tag','dataExported'])||
  packet.schema!==QL465_SCHEMA||packet.tenantId!==tenantId||
  packet.workspaceId!==workspaceId||packet.recordId!==recordId||
  packet.purpose!==purpose||packet.algorithm!=='AES-256-GCM'||
  packet.dataClass!=='ENCRYPTED_PII_LOCAL_ONLY'||packet.dataExported!==false)
  return hold('QL465_ENCRYPTED_CONTEXT_MISMATCH');
 try{
  requireKey(key);
  const iv=Buffer.from(packet.iv,'base64'),tag=Buffer.from(packet.tag,'base64');
  const data=Buffer.from(packet.ciphertext,'base64');
  if(iv.length!==12||tag.length!==16||data.length===0||data.length>8192||
   iv.toString('base64')!==packet.iv||tag.toString('base64')!==packet.tag||
   data.toString('base64')!==packet.ciphertext)
   return hold('QL465_ENCRYPTED_PACKET_MALFORMED');
  const decipher=createDecipheriv('aes-256-gcm',key,iv);
  decipher.setAAD(Buffer.from(JSON.stringify(encryptionContext(ctx))));
  decipher.setAuthTag(tag);
  const raw=Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
  const value=JSON.parse(raw);
  if(!validPiiRecord(value))return hold('QL465_DECRYPTED_FIELD_NOT_ALLOWLISTED');
  return {...hold('QL465_VERIFIED_LOCAL_OWNER_READ_ONLY'),
   state:'OWNER_LOCAL_DECRYPT_ONLY',value};
 }catch{return hold('QL465_DECRYPT_OR_AUTHENTICATION_FAILED');}
}

function verifySignature(envelope,pin,fields){
 try{
  if(!exact(envelope,['payload','signature'])||!exact(envelope.payload,fields)||
   typeof pin!=='string'||pin.length>512||
   typeof envelope.signature!=='string'||!/^[a-zA-Z0-9+/]{86}==$/.test(envelope.signature))
   return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const pub=createPublicKey({key:der,format:'der',type:'spki'});
  return pub.asymmetricKeyType==='ed25519'&&verify(null,
   Buffer.from(JSON.stringify(envelope.payload)),pub,Buffer.from(envelope.signature,'base64'));
 }catch{return false;}
}
const withdrawalFields=['schema','sourceId','tenantId','workspaceId','subjectRef','purpose',
 'requestId','requestedAt','decision','authorityTransfer'];
const requestFields=['schema','sourceId','tenantId','workspaceId','subjectRef','purpose',
 'requestId','requestedAt','requestType','authorityTransfer'];
const recordFields=['scopeDigest','requestDigest','state','observedAt'];
function openPrivateLedger(directory,auditKey){
 requireKey(auditKey);
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL465_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL465_DIRECTORY_PERMISSIONS_UNSAFE');
 const keyForScope=scope=>createHmac('sha256',auditKey)
  .update(JSON.stringify([scope.tenantId,scope.workspaceId,scope.subjectRef,scope.purpose]))
  .digest('hex');
 const keyForRequest=(kind,scope,requestId)=>createHmac('sha256',auditKey)
  .update(JSON.stringify([kind,keyForScope(scope),requestId])).digest('hex');
 const filename=(kind,id)=>{
  if(!['withdrawal','privacy_request'].includes(kind)||!HEX.test(id??''))
   throw Error('QL465_RECEIPT_KEY_INVALID');
  return join(root,'ql465-'+kind+'-'+id+'.json');
 };
 const hmac=record=>createHmac('sha256',auditKey).update(JSON.stringify(record)).digest('hex');
 const read=(kind,id)=>{
  let fd;
  try{fd=openSync(filename(kind,id),constants.O_RDONLY|constants.O_NOFOLLOW);}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  try{
   const stat=fstatSync(fd);
   if(!stat.isFile()||(stat.mode&0o077)||stat.size>2048)
    throw Error('QL465_RECEIPT_FILE_UNSAFE');
   const parsed=JSON.parse(readFileSync(fd,'utf8'));
   if(!exact(parsed,['schema','kind','recordId','evidence','mac'])||
    parsed.schema!==QL465_SCHEMA||parsed.kind!==kind||parsed.recordId!==id||
    !exact(parsed.evidence,recordFields)||!HEX.test(parsed.evidence.scopeDigest??'')||
    !HEX.test(parsed.evidence.requestDigest??'')||
    !['WITHDRAWAL_BLOCKING','DATA_SUBJECT_REQUEST_HELD'].includes(parsed.evidence.state)||
    !Number.isFinite(safeTime(parsed.evidence.observedAt))||
    parsed.mac!==hmac({schema:parsed.schema,kind:parsed.kind,recordId:id,evidence:parsed.evidence}))
    throw Error('QL465_AUDIT_AUTHENTICATION_FAILED');
   return parsed;
  }finally{closeSync(fd);}
 };
 const append=(kind,id,evidence)=>{
  if(read(kind,id))throw Error('QL465_DUPLICATE_OR_REPLAY');
  const unsigned={schema:QL465_SCHEMA,kind,recordId:id,evidence};
  const entry={...unsigned,mac:hmac(unsigned)};
  const fd=openSync(filename(kind,id),
   constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,JSON.stringify(entry));fsyncSync(fd);}finally{closeSync(fd);}
  const directoryFd=openSync(root,constants.O_RDONLY);
  try{fsyncSync(directoryFd);}finally{closeSync(directoryFd);}
  if(read(kind,id)?.mac!==entry.mac)throw Error('QL465_AUDIT_READBACK_MISMATCH');
  return entry;
 };
 return Object.freeze({keyForScope,keyForRequest,read,append});
}
/** HMAC authenticated, private-directory, write-once consent and request receipt storage. */
export function openQl465PrivacyLedger(directory,auditKey){
 return openPrivateLedger(directory,auditKey);
}
export function stageQl465ConsentWithdrawal({ledger,envelope,sourcePin,nowMs}={}){
 if(!ledger?.keyForScope||!ledger?.read||!ledger?.append)
  return hold('QL465_PRIVATE_LEDGER_REQUIRED');
 if(!verifySignature(envelope,sourcePin,withdrawalFields))
  return hold('QL465_SIGNED_WITHDRAWAL_REQUIRED');
 const e=envelope.payload;
 if(e.schema!=='rosevear.ql465.consent-withdrawal.v1'||!SOURCE_IDS.includes(e.sourceId)||
  !scopeValid(e)||!ID.test(e.requestId??'')||e.decision!=='WITHDRAW'||
  e.authorityTransfer!==false||!fresh(e.requestedAt,nowMs))
  return hold('QL465_WITHDRAWAL_SCOPE_OR_FRESHNESS_DENIED');
 try{
  const id=ledger.keyForScope(e),prior=ledger.read('withdrawal',id);
  const requestDigest=digest(e);
  if(prior)return {...hold('QL465_WITHDRAWAL_REMAINS_BLOCKING'),
   state:'CONSENT_WITHDRAWN_LOCAL_HOLD',duplicate:prior.evidence.requestDigest===requestDigest,
   receiptMac:prior.mac};
  const receipt=ledger.append('withdrawal',id,{
   scopeDigest:id,requestDigest,state:'WITHDRAWAL_BLOCKING',observedAt:new Date(nowMs).toISOString()});
  return {...hold('QL465_WITHDRAWAL_RECORDED_NO_PROVIDER_NOTIFICATION'),
   state:'CONSENT_WITHDRAWN_LOCAL_HOLD',receiptMac:receipt.mac};
 }catch{return hold('QL465_WITHDRAWAL_LEDGER_UNAVAILABLE_OR_TAMPERED');}
}
/** Consent is necessary, but never sufficient for live dispatch or export. */
export function assessQl465ConsentUse({ledger,tenantId,workspaceId,subjectRef,purpose,consentGranted=false}={}){
 const scope={tenantId,workspaceId,subjectRef,purpose};
 if(!ledger?.keyForScope||!ledger?.read||!scopeValid(scope))
  return hold('QL465_SCOPE_OR_LEDGER_INVALID');
 try{
  if(ledger.read('withdrawal',ledger.keyForScope(scope)))
   return hold('QL465_CONSENT_WITHDRAWN_BLOCK');
  if(consentGranted!==true)return hold('QL465_EXPLICIT_CONSENT_REQUIRED');
  return {...hold('QL465_LOCAL_CONSENT_REVIEW_NOT_DISPATCH_AUTHORIZATION'),
   state:'CONSENT_REVIEW_ONLY'};
 }catch{return hold('QL465_CONSENT_CUSTODY_UNAVAILABLE_OR_TAMPERED');}
}
/** Request receipt only. Never exports, erases or alters live customer records. */
export function stageQl465DataSubjectRequest({ledger,envelope,sourcePin,nowMs}={}){
 if(!ledger?.keyForRequest||!ledger?.read||!ledger?.append)
  return hold('QL465_PRIVATE_LEDGER_REQUIRED');
 if(!verifySignature(envelope,sourcePin,requestFields))
  return hold('QL465_SIGNED_PRIVACY_REQUEST_REQUIRED');
 const e=envelope.payload;
 if(e.schema!=='rosevear.ql465.data-subject-request.v1'||!SOURCE_IDS.includes(e.sourceId)||
  !scopeValid(e)||!ID.test(e.requestId??'')||
  !['ACCESS_EXPORT_REQUEST','DELETION_REQUEST','RETENTION_REVIEW_REQUEST'].includes(e.requestType)||
  e.authorityTransfer!==false||!fresh(e.requestedAt,nowMs))
  return hold('QL465_DATA_SUBJECT_SCOPE_OR_FRESHNESS_DENIED');
 try{
  const scope=ledger.keyForScope(e),id=ledger.keyForRequest('privacy_request',e,e.requestId);
  const requestDigest=digest(e),prior=ledger.read('privacy_request',id);
  if(prior){
   if(prior.evidence.requestDigest!==requestDigest)
    return hold('QL465_PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT');
   return {...hold('QL465_REQUEST_HELD_FOR_OWNER_REVIEW'),
    state:'PRIVACY_REQUEST_RECORDED_HOLD',duplicate:true,receiptMac:prior.mac};
  }
  const receipt=ledger.append('privacy_request',id,{
   scopeDigest:scope,requestDigest,state:'DATA_SUBJECT_REQUEST_HELD',
   observedAt:new Date(nowMs).toISOString()});
  return {...hold('QL465_REQUEST_HELD_FOR_OWNER_REVIEW'),
   state:'PRIVACY_REQUEST_RECORDED_HOLD',receiptMac:receipt.mac};
 }catch{return hold('QL465_REQUEST_CUSTODY_UNAVAILABLE_OR_TAMPERED');}
}
export function evaluateQl465Retention({createdAt,nowMs,retentionDays,legalHold,
 ownerAuthorized}={}){
 if(!Number.isSafeInteger(nowMs)||!Number.isFinite(safeTime(createdAt))||
  safeTime(createdAt)>nowMs||!Number.isInteger(retentionDays)||
  retentionDays<1||retentionDays>3650||typeof legalHold!=='boolean'||
  ownerAuthorized!==true)
  return hold('QL465_RETENTION_POLICY_OR_OWNER_EVIDENCE_REQUIRED');
 if(legalHold)return hold('QL465_LEGAL_HOLD_NO_ERASURE');
 const expired=nowMs-safeTime(createdAt)>=retentionDays*86400000;
 return {...hold(expired?'QL465_EXPIRED_NEEDS_OWNER_REVIEW':'QL465_POLICY_NOT_EXPIRED'),
  state:expired?'RETENTION_REVIEW_DUE_HOLD':'RETENTION_POLICY_REVIEW_ONLY',
  expired,scheduledDeletion:false};
}
