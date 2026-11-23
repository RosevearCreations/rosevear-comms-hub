/** QL-488: owner-supervised, opt-in private source transport and durable HOLD decision custody. */
import {request as httpsRequest} from 'node:https';
import {createHash} from 'node:crypto';
import {openSync,closeSync,readFileSync,writeFileSync,fsyncSync,fstatSync,statSync,mkdirSync,renameSync,unlinkSync,lstatSync,constants} from 'node:fs';
import {resolve,join,isAbsolute} from 'node:path';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';
const SHA256=/^[a-f0-9]{64}$/;
const sourceSet=new Set(QL485_SOURCE_IDS);
const hold=reason=>({state:'HOLD',reason,originalHostVerified:false,automaticPromotion:false,customerWrites:false});
const hash=data=>createHash('sha256').update(canonicalize(data)).digest('hex');
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const ENDPOINT_FIELDS=['sourceId','url','serverCertificateSha256','caPem','clientCertificatePem','clientKeyPem'];
const ENTRY_FIELDS=['sequence','previousDigest','sourceId','decisionId','decision','decisionDigest','receiptDigest','registryDigest','recordedAtMs','recordDigest'];
const safeDir=directory=>{
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.split(/[\\/]/).includes('..'))throw Error('QL488_PRIVATE_DIRECTORY_REQUIRED');
 const dir=resolve(directory);
 mkdirSync(dir,{recursive:true,mode:0o700});
 const st=lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||(process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL488_PRIVATE_DIRECTORY_UNSAFE');
 return dir;
};
/** No certificate TOFU: all six endpoints require prior owner provisioned CA/client cert and server fingerprint. */
export function validateQl488Enrollment(endpoints){
 if(!exact(endpoints,QL485_SOURCE_IDS))throw Error('QL488_EXACT_SIX_SOURCE_ENDPOINTS_REQUIRED');
 const hostnames=new Set(),fingerprints=new Set();
 for(const id of QL485_SOURCE_IDS){
  const entry=endpoints[id];
  if(!exact(entry,ENDPOINT_FIELDS)||entry.sourceId!==id||!SHA256.test(entry.serverCertificateSha256??'')||
   ['caPem','clientCertificatePem','clientKeyPem'].some(x=>typeof entry[x]!=='string'||entry[x].length<30||entry[x].length>16384))
   throw Error('QL488_INDEPENDENT_MTLS_TRUST_CONFIG_REQUIRED');
  let url;
  try{url=new URL(entry.url)}catch{throw Error('QL488_PRIVATE_HTTPS_URL_REQUIRED')}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
   url.pathname!=='/internal/comms/source-release'||
   !/^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(url.hostname)||
   url.hostname.endsWith('.local')||url.hostname.endsWith('.localhost')||
   ![443,8443].includes(Number(url.port||443)))
   throw Error('QL488_PRIVATE_HTTPS_URL_REQUIRED');
  if(hostnames.has(url.host)||fingerprints.has(entry.serverCertificateSha256))
   throw Error('QL488_CROSS_SOURCE_TRANSPORT_REUSE_DENIED');
  hostnames.add(url.host);fingerprints.add(entry.serverCertificateSha256);
 }
 return Object.freeze({state:'SIX_SOURCE_TRANSPORT_CONFIG_VALIDATED_NOT_CONNECTED',
  sourceCount:6,originalHostVerified:false,transportProved:false,automaticListen:false});
}
/** This real HTTPS client is never invoked without an explicit caller action.
 * Each source has a fixed owner-approved endpoint, distinct pinned server cert, CA,
 * and client credentials. No redirects, DNS URLs from payloads, cookies or auth headers.
 */
export async function probeQl488PrivateEndpoint(entry,{timeoutMs=5000}={}){
 if(!exact(entry,ENDPOINT_FIELDS)||!sourceSet.has(entry.sourceId)||!SHA256.test(entry.serverCertificateSha256??''))
  return hold('QL488_OWNER_ENROLLED_SOURCE_REQUIRED');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>10000)
  return hold('QL488_BOUNDED_TIMEOUT_REQUIRED');
 return new Promise(resolveResult=>{
  const url=new URL(entry.url);
  let finished=false;
  const finish=value=>{if(!finished){finished=true;resolveResult(value)}};
  const req=httpsRequest(url,{method:'GET',agent:false,timeout:timeoutMs,
   minVersion:'TLSv1.3',rejectUnauthorized:true,ca:entry.caPem,
   cert:entry.clientCertificatePem,key:entry.clientKeyPem,
   headers:{accept:'application/json','cache-control':'no-store'},
   checkServerIdentity:(host,cert)=>{
    const {checkServerIdentity}=requireHttpsIdentity();
    const error=checkServerIdentity(host,cert);
    if(error)return error;
    if((cert.fingerprint256??'').replaceAll(':','').toLowerCase()!==entry.serverCertificateSha256)
     return Error('QL488_SERVER_CERTIFICATE_PIN_MISMATCH');
   }},res=>{
   if(res.statusCode!==200||!/^application\/json(?:;|$)/i.test(String(res.headers['content-type']??''))){
    res.resume();finish(hold('QL488_PRIVATE_SOURCE_HTTP_OR_MEDIA_DENIED'));return;
   }
   let body='',bytes=0;
   res.on('data',chunk=>{bytes+=chunk.length;if(bytes>128000){req.destroy();finish(hold('QL488_OVERSIZED_SOURCE_RESPONSE'));return}body+=chunk.toString('utf8')});
   res.on('end',()=>{try{const payload=JSON.parse(body);
    if(payload?.sourceId!==entry.sourceId)return finish(hold('QL488_SOURCE_ID_MISMATCH'));
    finish({state:'MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',sourceId:entry.sourceId,bundle:payload,
     originalHostVerified:false,sourceAuthorized:false});
   }catch{finish(hold('QL488_MALFORMED_PRIVATE_SOURCE_RESPONSE'))}});
  });
  req.on('timeout',()=>req.destroy(Error('timeout')));
  req.on('error',()=>finish(hold('QL488_PRIVATE_TLS_HANDSHAKE_OR_NETWORK_FAILED')));
  req.end();
 });
}
/** Built-in HTTPS hostname check; no dynamic imports or dependency injection of trust. */
import {checkServerIdentity} from 'node:tls';
function requireHttpsIdentity(){return {checkServerIdentity}}
/** Lock, replay and digest-check every private decision. Fail closed on tampering. */
export function createQl488DecisionLedger({directory,now=()=>Date.now()}={}){
 const dir=safeDir(directory),path=join(dir,'ql488-operator-decisions.ndjson'),lock=join(dir,'.ql488-decision.lock');
 function read(){
  let fd;try{fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW)}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  try{
   const st=fstatSync(fd);
   if(!st.isFile()||st.size>2000000||(process.platform!=='win32'&&(st.mode&0o077)))
    throw Error('QL488_PRIVATE_DECISION_LOG_UNSAFE');
   const raw=readFileSync(fd,'utf8');
   if(!raw.endsWith('\n'))throw Error('QL488_DECISION_LOG_TRUNCATED');
   const rows=raw.trimEnd().split('\n').map(s=>JSON.parse(s));
   let prev=null;
   rows.forEach((r,i)=>{
    if(!exact(r,ENTRY_FIELDS)||r.sequence!==i+1||r.previousDigest!==prev||
     !sourceSet.has(r.sourceId)||!SHA256.test(r.recordDigest)||hash(Object.fromEntries(
      ENTRY_FIELDS.filter(k=>k!=='recordDigest').map(k=>[k,r[k]])))!==r.recordDigest)
     throw Error('QL488_DECISION_CHAIN_TAMPERED');
    prev=r.recordDigest;
   });
   if(rows.length>128)throw Error('QL488_DECISION_LOG_FULL');
   return rows;
  }finally{closeSync(fd)}
 }
 function append({sourceId,decisionId,decision,decisionDigest,receiptDigest,registryDigest}={}){
  if(!sourceSet.has(sourceId)||typeof decisionId!=='string'||!/^[a-zA-Z0-9_-]{8,96}$/.test(decisionId)||
   !['ACKNOWLEDGE_HOLD','REQUEST_INDEPENDENT_REVIEW'].includes(decision)||
   ![decisionDigest,receiptDigest,registryDigest].every(v=>SHA256.test(v??'')))
   return hold('QL488_SIGNED_HOLD_DECISION_AND_DURABLE_RECEIPT_REQUIRED');
  let fd;try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600)}
  catch{return hold('QL488_SINGLE_WRITER_LOCK_REQUIRED')}
  try{
   const rows=read();
   const same=rows.find(r=>r.sourceId===sourceId&&r.decisionId===decisionId);
   if(same)return same.decisionDigest===decisionDigest&&same.receiptDigest===receiptDigest?
    {state:'DURABLE_DECISION_REPLAY_HELD',recordDigest:same.recordDigest,authorityTransfer:false}:
    hold('QL488_DECISION_ID_CONFLICT');
   if(rows.length>=128)return hold('QL488_DECISION_LOG_CAPACITY_REVIEW');
   const data={sequence:rows.length+1,previousDigest:rows.at(-1)?.recordDigest??null,
    sourceId,decisionId,decision,decisionDigest,receiptDigest,registryDigest,recordedAtMs:now()};
   const record={...data,recordDigest:hash(data)};
   const out=openSync(path,constants.O_WRONLY|constants.O_APPEND|constants.O_NOFOLLOW|
    (rows.length?0:constants.O_CREAT|constants.O_EXCL),0o600);
   try{writeFileSync(out,JSON.stringify(record)+'\n');fsyncSync(out)}finally{closeSync(out)}
   if(read().at(-1)?.recordDigest!==record.recordDigest)return hold('QL488_DURABLE_READBACK_FAILED');
   return {state:'DURABLE_OPERATOR_DECISION_RECORDED_HELD',sourceId,sequence:record.sequence,
    recordDigest:record.recordDigest,authorityTransfer:false,productionAcceptance:false};
  }catch{return hold('QL488_PRIVATE_DECISION_CHAIN_OR_WRITE_FAILED')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 function summary(){
  try{const rows=read();return {state:'PRIVATE_OPERATOR_DECISIONS_HELD',
   decisionCount:rows.length,lastDigest:rows.at(-1)?.recordDigest??null,
   perSource:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,rows.filter(r=>r.sourceId===id).length])),
   productionAcceptance:false}}
  catch{return hold('QL488_PRIVATE_DECISION_CHAIN_TAMPER_HOLD')}
 }
 return Object.freeze({append,summary,automaticListener:false,sourceWrites:false,customerWrites:false});
}
/** QL487 verifies independently pinned operator signatures and current notice.
 * QL488 only persists successful HOLD decisions after a matching durable QL486 source receipt.
 */
export function createQl488OperatorCustody({sync,registry,ledger}={}){
 if(typeof sync?.reconcile!=='function'||typeof registry?.summary!=='function'||
  typeof ledger?.append!=='function')throw Error('QL488_SCOPED_CUSTODY_DEPENDENCIES_REQUIRED');
 function record({signedDecision,noticePacket,receiptDigest}={}){
  const reviewed=sync.reconcile(signedDecision,{noticePacket});
  if(reviewed.state!=='OPERATOR_DECISION_RECORDED_IN_MEMORY_HOLD')
   return hold('QL488_ORIGINAL_SIGNED_OPERATOR_REVIEW_REQUIRED');
  const snap=registry.summary(),source=snap.sources?.[reviewed.sourceId];
  if(snap.state!=='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'||
   source?.evidenceDigest!==receiptDigest||!SHA256.test(receiptDigest??'')||
   snap.registryDigest!==signedDecision.payload.registryDigest)
   return hold('QL488_DURABLE_SOURCE_RECEIPT_OR_REGISTRY_CHANGED');
  return ledger.append({sourceId:reviewed.sourceId,decisionId:signedDecision.payload.decisionId,
   decision:reviewed.decision,decisionDigest:reviewed.decisionDigest,
   receiptDigest,registryDigest:snap.registryDigest});
 }
 return Object.freeze({record,automaticApproval:false,sourceWrites:false,customerWrites:false});
}
