#!/usr/bin/env node
/**
 * QL479 owner-operated one-shot remote receiver or original-host sender.
 * NO automatic host enrollment, no scheduled task, no public Cloudflare route.
 * Private operator JSON config must be placed outside GitHub checkout.
 */
import {readFileSync,writeFileSync,openSync,closeSync,lstatSync,constants} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reviewQl477FieldBundle} from './ql477-field-telemetry.mjs';
import {reviewQl479PeerEnrollment,createQl479UnboundRemoteReceiver,
 buildQl479SignedSample,sendQl479Once} from './ql479-enrolled-remote-pilot.mjs';
const STOP=x=>{throw Error('HOLD_QL479_'+x)};
const hash=x=>createHash('sha256').update(x).digest('hex');
function privateBytes(path){
 if(typeof path!=='string'||!isAbsolute(path))STOP('PRIVATE_ABSOLUTE_PATH_REQUIRED');
 const p=resolve(path),source=process.platform==='win32'?'C:\\rc470':null;
 if(source&&p.toLowerCase().startsWith(source.toLowerCase()+sep))STOP('PRIVATE_KEY_WITHIN_REPO');
 if(process.platform==='win32'){
   const dir=resolve(process.env.LOCALAPPDATA??'');
   if(!p.toLowerCase().startsWith(dir.toLowerCase()+sep.toLowerCase()))
     STOP('PRIVATE_FILE_NOT_IN_OWNER_LOCALAPPDATA');
 }
 const st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||
    (process.platform!=='win32'&&(st.mode&0o077)))
   STOP('PRIVATE_FILE_UNSAFE');
 if(st.size>200000)STOP('PRIVATE_FILE_TOO_LARGE');
 return readFileSync(p);
}
function readJson(p){return JSON.parse(privateBytes(p).toString('utf8'))}
function exact(o,fields){
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==fields.length||
    fields.some(k=>!Object.hasOwn(o,k)))STOP('OWNER_CONFIG_FIELDS_INVALID');
}
function evidence(config,sha){
 const bytes=privateBytes(config.evidencePath);
 const report=JSON.parse(bytes.toString('utf8'));
 const field=reviewQl477FieldBundle({report,expectedMainSha:sha});
 if(field.state!=='FIELD_EXPORT_REVIEW_HELD')STOP('CURRENT_QL477_FIELD_EVIDENCE_REQUIRED');
 return {bytes,field};
}
function enrolled(c,field){
 const x=readJson(c.enrollmentPath);
 exact(x,['ownerPacket','receiverPacket','ownerPin','receiverCustodianPin']);
 const result=reviewQl479PeerEnrollment({
   ...x,field});
 if(!['SIMULATION_ENROLLED_HELD','REMOTE_ENROLLED_REVIEW_HELD'].includes(result.state))
   STOP('INDEPENDENT_PEER_ENROLLMENT_DENIED');
 return result;
}
function outputOnce(path,value){
 const p=resolve(path);
 if(!isAbsolute(path))STOP('PRIVATE_RESULT_ABSOLUTE_PATH_REQUIRED');
 if(process.platform==='win32'){
  const dir=resolve(process.env.LOCALAPPDATA??'');
  if(!p.toLowerCase().startsWith(dir.toLowerCase()+sep.toLowerCase()))
   STOP('PRIVATE_RESULT_NOT_IN_OWNER_LOCALAPPDATA');
 }
 const fd=openSync(p,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL,0o600);
 try{writeFileSync(fd,JSON.stringify(value,null,2));}
 finally{closeSync(fd)}
}
const limitedBind=addr=>{
 if(addr==='127.0.0.1')return true;
 const a=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr??'');
 if(!a)return false;const [,w,x,y,z]=a.map(Number);
 if([w,x,y,z].some(q=>q>255))return false;
 return w===10||(w===172&&x>=16&&x<=31)||(w===192&&x===168);
};
async function receiver(config){
 exact(config,['enrollmentPath','evidencePath','sourceMainSha','tlsCaPath',
   'serverCertPath','serverKeyPath','receiverPrivateKeyPath','ledgerPath','bindAddress']);
 if(!limitedBind(config.bindAddress))STOP('PRIVATE_BIND_ADDRESS_REQUIRED');
 const {field}=evidence(config,config.sourceMainSha),r=enrolled(config,field);
 if(r.state==='REMOTE_ENROLLED_REVIEW_HELD'&&config.bindAddress==='127.0.0.1')
   STOP('REMOTE_PILOT_MUST_BIND_APPROVED_PRIVATE_INTERFACE');
 if(r.state==='SIMULATION_ENROLLED_HELD'&&config.bindAddress!=='127.0.0.1')
   STOP('SIMULATION_MUST_USE_LOOPBACK');
 const read=k=>privateBytes(config[k]);
 const receiver=createQl479UnboundRemoteReceiver({enrollmentReview:r,field,
  directory:config.ledgerPath,receiverPrivateKey:read('receiverPrivateKeyPath'),
  tlsOptions:{ca:read('tlsCaPath'),cert:read('serverCertPath'),
    key:read('serverKeyPath'),pinnedHostIssuerPin:r.enrollment.sourceSignerPin}});
 const server=receiver.server;
 const stop=()=>server.close();
 server.on('request',(_req,res)=>{
   res.once('finish',()=>{if(res.statusCode===202||res.statusCode===200)stop()});
 });
 const expiry=setTimeout(()=>{if(server.listening)server.close()},120000);
 expiry.unref();
 await new Promise((yes,no)=>{
  server.once('error',no);
  server.listen(r.enrollment.remotePort,config.bindAddress,yes);
 });
 process.stdout.write(JSON.stringify({state:'SUPERVISED_RECEIVER_MANUALLY_LISTENING',
  bindAddress:config.bindAddress,port:r.enrollment.remotePort,
  expiresAtMs:r.enrollment.expiresAtMs,messageId:r.enrollment.pilotMessageId,
  customerDataIncluded:false,autostart:false})+'\n');
 await new Promise((yes,no)=>{server.once('close',yes);server.once('error',no)});
}
async function sourceSend(config){
 exact(config,['enrollmentPath','evidencePath','reconciliationPath',
   'tlsCaPath','clientCertPath','clientKeyPath','sourcePrivateKeyPath','resultPath']);
 if(process.platform!=='win32'||process.env.COMPUTERNAME!=='DESKTOP-AE894KC')
  STOP('ORIGINAL_WINDOWS_HOST_REQUIRED');
 const root='C:\\rc470';
 const branch=execFileSync('git',['-C',root,'branch','--show-current'],{encoding:'utf8'}).trim();
 const sha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const dirty=execFileSync('git',['-C',root,'status','--porcelain=v1'],{encoding:'utf8'}).trim();
 if(branch!=='main'||dirty||!/^[a-f0-9]{40}$/.test(sha))
   STOP('CLEAN_ORIGINAL_MAIN_REQUIRED');
 const {bytes,field}=evidence(config,sha);
 const previous=readJson(config.reconciliationPath);
 if(previous.schema!=='rosevear.comms.ql478.host-local-reconciliation.v1'||
  previous.mainSha!==sha||previous.ql477FileSha256!==hash(bytes)||
  previous.state!=='LOCAL_READBACK_VERIFIED_INDEPENDENT_WITNESS_AND_LIVE_ACK_HOLD'||
  previous.sourceDeletions!==0||previous.firstProductionAckVerified!==false||
  !Number.isSafeInteger(previous.observedAtMs)||
  previous.observedAtMs>Date.now()||Date.now()-previous.observedAtMs>300000)
   STOP('ORIGINAL_QL478_LOCAL_RECONCILIATION_REQUIRED');
 const r=enrolled(config,field);
 if(r.state!=='REMOTE_ENROLLED_REVIEW_HELD')
   STOP('REMOTE_NOT_SIMULATION_ENROLLMENT_REQUIRED');
 const signed=buildQl479SignedSample({enrollmentReview:r,field,
   hostPrivateKey:privateBytes(config.sourcePrivateKeyPath)});
 const result=await sendQl479Once({enrollmentReview:r,field,packet:signed,
   tlsOptions:{ca:privateBytes(config.tlsCaPath),
    cert:privateBytes(config.clientCertPath),
    key:privateBytes(config.clientKeyPath)}});
 if(result.state!=='REMOTE_MTLS_ACK_OBSERVED_REVIEW_HELD')
  STOP('REMOTE_ACK_NOT_ACCEPTED_'+result.reason);
 outputOnce(config.resultPath,{
   schema:'rosevear.comms.ql479.original-host-remote-ack-record.v1',
   state:'REMOTE_MTLS_ACK_OBSERVED_INDEPENDENT_FIELD_ACCEPTANCE_HELD',
   sourceMainSha:sha,enrollmentId:result.enrollmentId,messageId:result.messageId,
   fieldDigest:result.fieldDigest,ackDigest:result.ackDigest,
   tlsServerPinVerified:true,receiverSignatureVerified:true,localDiskReceiptVerified:false,
   independentWitnessCertified:false,sourceDeletions:0,observedAtMs:Date.now()});
 process.stdout.write(JSON.stringify({state:result.state,messageId:result.messageId,
   ackDigest:result.ackDigest,independentHostCertification:'HOLD'})+'\n');
}
async function main(){
 const mode=process.argv[2];
 if(process.argv.length!==3||!['--supervised-receiver','--supervised-source-send'].includes(mode))
  STOP('EXPLICIT_SUPERVISED_ONE_SHOT_MODE_REQUIRED');
 if(process.env.QL479_OWNER_APPROVAL!=='SUPERVISED_ONE_TIME'||
    !process.env.QL479_PRIVATE_CONFIG)
    STOP('CURRENT_OWNER_APPROVAL_AND_PRIVATE_CONFIG_REQUIRED');
 const config=readJson(process.env.QL479_PRIVATE_CONFIG);
 if(mode==='--supervised-receiver')return receiver(config);
 return sourceSend(config);
}
main().catch(e=>{process.stderr.write(String(e?.message||e)+'\n');process.exitCode=1});
