#!/usr/bin/env node
/**
 * QL-478 manually supervised ORIGINAL-HOST private loopback pilot.
 * Requires real owner-custodied TLS and distinct Ed25519 keys.
 * This is never run by GitHub CI, Cloudflare, task scheduler or boot.
 */
import {execFileSync} from 'node:child_process';
import {createHash,createPrivateKey,createPublicKey,sign,X509Certificate,randomUUID} from 'node:crypto';
import {readFileSync,lstatSync,openSync,writeFileSync,closeSync,constants} from 'node:fs';
import {request} from 'node:https';
import {isAbsolute,resolve,sep} from 'node:path';
import {reviewQl477FieldBundle} from './ql477-field-telemetry.mjs';
import {QL478_ROUTE,QL478_SAMPLE,createQl478PrivateSink,
 createQl478UnboundHttpsServer,verifyQl478SignedAck} from './ql478-private-pilot.mjs';

const HOLD=x=>{throw Error('HOLD_QL478_'+x)};
const sha=x=>createHash('sha256').update(x).digest('hex');
const root='C:\\rc470';
const priv=resolve(process.env.LOCALAPPDATA??'');
function privateFile(path){
 if(typeof path!=='string'||!isAbsolute(path))HOLD('ABSOLUTE_PRIVATE_PATH_REQUIRED');
 const resolved=resolve(path);
 if(!resolved.toLowerCase().startsWith(priv.toLowerCase()+sep.toLowerCase())||
    resolved.toLowerCase().startsWith(root.toLowerCase()+sep.toLowerCase()))
    HOLD('NO_REPO_OR_SHARED_EVIDENCE_FILE');
 const st=lstatSync(resolved);
 if(!st.isFile()||st.isSymbolicLink()||(process.platform!=='win32'&&(st.mode&0o077)))
    HOLD('PRIVATE_FILE_OWNER_ONLY_REQUIRED');
 return readFileSync(resolved);
}
async function main(){
 if(process.platform!=='win32'||process.env.COMPUTERNAME!=='DESKTOP-AE894KC')
    HOLD('ORIGINAL_HOST_REQUIRED');
 if(process.argv.length!==3||process.argv[2]!=='--supervised-one-time-loopback')
    HOLD('OWNER_SUPERVISED_ONE_TIME_OPT_IN_REQUIRED');
 if(!process.env.QL478_TRUST_CONFIG)HOLD('PRIVATE_TRUST_CONFIG_REQUIRED');
 const branch=execFileSync('git',['-C',root,'branch','--show-current'],{encoding:'utf8'}).trim();
 const mainSha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const dirty=execFileSync('git',['-C',root,'status','--porcelain=v1'],{encoding:'utf8'}).trim();
 if(branch!=='main'||dirty||!/^[a-f0-9]{40}$/.test(mainSha))HOLD('CLEAN_MAIN_REQUIRED');
 const config=JSON.parse(privateFile(process.env.QL478_TRUST_CONFIG).toString('utf8'));
 const names=['ca','serverCert','serverKey','clientCert','clientKey',
  'hostSigningKey','receiverSigningKey','hostSigningPin','receiverSigningPin',
  'clientCertLeafSha256','evidenceJsonPath','reconciliationJsonPath','ledgerPath','resultPath'];
 if(Object.keys(config).length!==names.length||names.some(k=>!Object.hasOwn(config,k)))
  HOLD('TRUST_CONFIG_EXACT_ALLOWLIST_REQUIRED');
 const evidenceBytes=privateFile(config.evidenceJsonPath);
 const field=reviewQl477FieldBundle({report:JSON.parse(evidenceBytes.toString('utf8')),
  expectedMainSha:mainSha});
 if(field.state!=='FIELD_EXPORT_REVIEW_HELD')HOLD('CURRENT_FIELD_EVIDENCE_REQUIRED');
 const recon=JSON.parse(privateFile(config.reconciliationJsonPath).toString('utf8'));
 if(recon.schema!=='rosevear.comms.ql478.host-local-reconciliation.v1'||
    recon.host!=='DESKTOP-AE894KC'||recon.mainSha!==mainSha||
    recon.ql477FileSha256!==sha(evidenceBytes)||
    recon.state!=='LOCAL_READBACK_VERIFIED_INDEPENDENT_WITNESS_AND_LIVE_ACK_HOLD'||
    recon.firstProductionAckVerified!==false||
    recon.independentPhysicalWitnessConfirmed!==false||
    !Number.isSafeInteger(recon.observedAtMs)||Date.now()-recon.observedAtMs>300000||
    recon.observedAtMs>Date.now())HOLD('FRESH_LOCAL_RECONCILIATION_REQUIRED');
 const read=k=>privateFile(config[k]);
 const clientCert=read('clientCert'),serverCert=read('serverCert');
 const leaf=sha(new X509Certificate(clientCert).raw);
 if(leaf!==config.clientCertLeafSha256||!(/^[a-f0-9]{64}$/.test(leaf)))
    HOLD('PINNED_CERT_IDENTITY_REQUIRED');
 const hostKey=createPrivateKey(read('hostSigningKey')),receiverKey=createPrivateKey(read('receiverSigningKey'));
 if(hostKey.asymmetricKeyType!=='ed25519'||receiverKey.asymmetricKeyType!=='ed25519')
    HOLD('ED25519_SIGNERS_REQUIRED');
 const pin=k=>createPublicKey(k).export({format:'der',type:'spki'}).toString('base64');
 if(pin(hostKey)!==config.hostSigningPin||pin(receiverKey)!==config.receiverSigningPin||
    pin(hostKey)===pin(receiverKey))HOLD('ORIGINAL_DISTINCT_PINS_REQUIRED');
 if(!isAbsolute(config.ledgerPath)||!resolve(config.ledgerPath).toLowerCase().startsWith(priv.toLowerCase()+sep.toLowerCase()))
    HOLD('PRIVATE_LEDGER_LOCATION_REQUIRED');
 let server;
 try{
  const sink=createQl478PrivateSink({directory:config.ledgerPath,
    hostIssuerPin:config.hostSigningPin,receiverPrivateKey:receiverKey,
    expectedField:field,clientLeafSha256:leaf});
  server=createQl478UnboundHttpsServer({sink,tlsOptions:{
    ca:read('ca'),cert:serverCert,key:read('serverKey'),
    pinnedHostIssuerPin:config.hostSigningPin}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const messageId=randomUUID(),now=Date.now(),t=field.telemetry;
  const payload={schema:QL478_SAMPLE,messageId,host:'DESKTOP-AE894KC',
    sourceApp:'rosevear-comms-hub',sourceMainSha:mainSha,
    workerScriptSha256:t.workerScriptSha256,fieldDigest:field.fieldDigest,
    sampleDigest:field.sampleDigest,sampleId:field.sampleId,osBootId:t.osBootId,
    observedAtMs:t.observedAtMs,uptimeSeconds:t.uptimeSeconds,processCount:t.processCount,
    dataClass:'NON_SENSITIVE_AGGREGATE',issuedAtMs:now,expiresAtMs:now+60000,
    authorityTransfer:false,receiverEnableAuthorized:false};
  const packet={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),hostKey).toString('base64')};
  const addr=server.address();
  const response=await new Promise((resolve,reject)=>{
    const req=request({hostname:'127.0.0.1',port:addr.port,path:QL478_ROUTE,method:'POST',
      ca:read('ca'),cert:clientCert,key:read('clientKey'),minVersion:'TLSv1.3',
      rejectUnauthorized:true,timeout:15000},res=>{
      let s='';res.on('data',b=>{s+=b;if(s.length>8192)res.destroy()});
      res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(s)})}catch(e){reject(e)}})});
    req.on('timeout',()=>req.destroy(Error('TLS_TIMEOUT')));req.on('error',reject);
    req.end(JSON.stringify(packet));
  });
  if(response.status!==202)HOLD('PRIVATE_FIRST_ACK_REJECTED');
  const reviewed=verifyQl478SignedAck({packet,ack:response.body,
    hostPin:config.hostSigningPin,receiverPin:config.receiverSigningPin,expectedLeafSha256:leaf});
  if(reviewed.state!=='SIGNED_DURABLE_ACK_REVIEW_HELD')HOLD('ACK_SIGNATURE_OR_DISK_READBACK');
  const report={schema:'rosevear.comms.ql478.one-time-loopback-result.v1',
   state:'LOCAL_REAL_TLS13_ACK_CORROBORATED_INDEPENDENT_FIELD_WITNESS_HOLD',
   host:'DESKTOP-AE894KC',mainSha,messageId,
   fieldDigest:field.fieldDigest,ackDigest:reviewed.ackDigest,
   tlsClientLeafSha256:leaf,localOnly:true,originalHostPhysicalWitnessCertified:false,
   productionPeerAcknowledged:false,receiverAutostart:false,
   sourceDeletions:0,observedAtMs:Date.now()};
  // Exclusive private result path: never overwrite an existing record.
  const output=resolve(config.resultPath);
  if(!output.toLowerCase().startsWith(priv.toLowerCase()+sep.toLowerCase()))HOLD('RESULT_PRIVATE_PATH_REQUIRED');
  const fd=openSync(output,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL,0o600);
  try{writeFileSync(fd,JSON.stringify(report,null,2))}finally{closeSync(fd)}
  process.stdout.write(JSON.stringify({state:report.state,messageId,
    mainSha,ackDigest:report.ackDigest,sourceDeletions:0})+'\n');
 }finally{if(server?.listening)await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{process.stderr.write(String(e.message||e)+'\n');process.exitCode=1});
