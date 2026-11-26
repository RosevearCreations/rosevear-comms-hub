#!/usr/bin/env node
/** QL-501. Status is fully offline. One signed trial requires original Ree
 * Windows session, genuine local source packet, provider pins, mTLS and
 * explicit approval. No customer messages or automated retry.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,join,sep,isAbsolute} from 'node:path';
import {discoverQl500OriginalProviderConfig}
 from './ql500-original-provider-custody.mjs';
import {runQl501OneSupervisedTrial,verifyQl501SourcePacket}
 from './ql501-source-signed-delivery-trial.mjs';
import {recordQl501PrivateTrial} from './ql501-private-trial-journal.mjs';
const HEX=/^[a-f0-9]{64}$/,NAME=/^[A-Za-z0-9_.-]{8,96}$/;
const fields=['endpointUrl','serverCertificateSha256','caFile',
 'clientCertificateFile','clientKeyFile','sourcePacketFile',
 'sourcePublicKeyFile','providerPublicKeyFile','reviewerPublicKeyFile',
 'sourceId','tenantScopeDigest','explicitOwnerApproval'];
const original=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 String(process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
const hold=reason=>({state:'HOLD',reason,originalDevicePhysicallyCertified:false,
 liveMasterDeliveryCertified:false,productionReleaseAuthorized:false,
 automaticNetworkSend:false,customerWrites:false});
function privateFile(dir,name){
 if(typeof name!=='string'||!NAME.test(name))throw Error('QL501_SAFE_BASENAME_REQUIRED');
 const p=join(dir,name);
 if(!p.startsWith(dir+sep))throw Error('QL501_PATH_ESCAPE');
 const st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size<32||st.size>131072)
  throw Error('QL501_MISSING_SAFE_PRIVATE_FILE');
 return readFileSync(p);
}
async function main(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  console.log(JSON.stringify({state:'QL501_SUPERVISED_SIGNED_TRIAL_NOT_RUN',
   originalHostCandidate:original(),providerAckObserved:false,
   sourceOperationallyCertified:false,humanAcknowledged:false,
   productionReleaseAuthorized:false,automaticNetworkSend:false,
   customerWrites:false}));
  return;
 }
 if(process.argv.length!==3||process.argv[2]!=='--supervised-trial'||
  !original()||!process.env.LOCALAPPDATA||!isAbsolute(process.env.LOCALAPPDATA))
  throw Error('QL501_SUPERVISED_ORIGINAL_WINDOWS_ONLY');
 const root=resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink())throw Error('QL501_PRIVATE_ROOT_UNSAFE');
 const prior=discoverQl500OriginalProviderConfig({directory:root});
 if(prior.state!=='QL500_ORIGINAL_PROVIDER_CONFIG_DISCOVERED_REVIEW_HELD')
  throw Error('QL501_REAL_PREAPPROVED_QL500_PROVIDER_CONFIGURATION_REQUIRED');
 const p=JSON.parse(privateFile(root,'ql501-owner-approved-trial.json').toString('utf8'));
 if(!p||Array.isArray(p)||typeof p!=='object'||
  Object.keys(p).length!==fields.length||
  fields.some(k=>!Object.hasOwn(p,k))||
  !HEX.test(p.serverCertificateSha256??'')||
  !HEX.test(p.tenantScopeDigest??'')||
  p.explicitOwnerApproval!=='ONE_SOURCE_SIGNED_PRIVATE_TRIAL_HOLD_ONLY')
  throw Error('QL501_EXPLICIT_ONE_TRIAL_APPROVAL_MISSING');
 const previous=JSON.parse(privateFile(root,'ql499-owner-approved-probe.json').toString('utf8'));
 if(p.caFile!==previous.caFile||
  p.clientCertificateFile!==previous.clientCertificateFile||
  p.clientKeyFile!==previous.clientKeyFile||
  p.serverCertificateSha256!==prior.serverCertificateSha256||
  new URL(p.endpointUrl).origin!==new URL(prior.endpointUrl).origin)
  throw Error('QL501_ORIGINAL_MASTER_PROVIDER_PIN_OR_CERTIFICATE_CHANGED');
 const fileNames=['caFile','clientCertificateFile','clientKeyFile',
  'sourcePacketFile','sourcePublicKeyFile','providerPublicKeyFile',
  'reviewerPublicKeyFile'];
 if(fileNames.some(k=>typeof p[k]!=='string'||!NAME.test(p[k]))||
  new Set(fileNames.map(k=>p[k])).size!==fileNames.length)
  throw Error('QL501_SIGNER_OR_SECRET_PATH_REUSE');
 const data=Object.fromEntries(fileNames.map(k=>[k,privateFile(root,p[k])]));
 const packet=JSON.parse(data.sourcePacketFile.toString('utf8'));
 const approvedPins={sourcePublicKeyPem:data.sourcePublicKeyFile.toString('utf8'),
  providerPublicKeyPem:data.providerPublicKeyFile.toString('utf8'),
  independentReviewerPublicKeyPem:data.reviewerPublicKeyFile.toString('utf8')};
 const check=verifyQl501SourcePacket({sourcePacket:packet,
  sourcePublicKeyPem:approvedPins.sourcePublicKeyPem,
  approvedSourceId:p.sourceId,
  approvedTenantScopeDigest:p.tenantScopeDigest});
 if(check.state==='HOLD')throw Error('QL501_SOURCE_SIGNED_PACKET_NOT_VALID');
 const reserve=recordQl501PrivateTrial({directory:root,phase:'RESERVED',
  trialId:check.trialId,sourcePacketDigest:check.sourcePacketDigest});
 if(reserve.state==='HOLD')throw Error('QL501_ALREADY_ATTEMPTED_OR_JOURNAL_UNSAFE');
 const result=await runQl501OneSupervisedTrial({config:{
  url:p.endpointUrl,serverCertificateSha256:p.serverCertificateSha256,
  caPem:data.caFile,clientCertificatePem:data.clientCertificateFile,
  clientKeyPem:data.clientKeyFile},sourcePacket:packet,approvedPins,
  approvedSourceId:p.sourceId,
  approvedTenantScopeDigest:p.tenantScopeDigest});
 const ok=result.state==='QL501_PINNED_LIVE_MASTER_SIGNED_ACK_OBSERVED_REVIEW_HELD';
 const after=recordQl501PrivateTrial({directory:root,
  phase:ok?'PROVIDER_ACK_HELD':'FAILED_OR_UNKNOWN',
  trialId:check.trialId,sourcePacketDigest:check.sourcePacketDigest,
  providerPacketDigest:ok?result.providerPacketDigest:null});
 if(after.state==='HOLD')throw Error('QL501_ORIGINAL_TRIAL_OUTCOME_NOT_DURABLE');
 console.log(JSON.stringify({state:ok?result.state:'HOLD',
  reason:ok?undefined:'QL501_ORIGINAL_MASTER_TRIAL_FAILED_OR_UNKNOWN',
  trialId:check.trialId,originalHostCandidate:true,
  sourcePacketDigest:check.sourcePacketDigest,
  providerPacketDigest:ok?result.providerPacketDigest:null,
  localAuditRecordDigest:after.recordDigest,
  actualPinnedClientTlsRequestCompleted:ok,
  independentThirdPartyNetworkWitness:false,
  originalDevicePhysicallyCertified:false,
  humanAcknowledged:false,productionReleaseAuthorized:false,
  automaticNetworkSend:false,customerWrites:false}));
 if(!ok)process.exitCode=2;
}
main().catch(error=>{
 console.error(JSON.stringify(hold(
  String(error.message??'').startsWith('QL501_')?error.message:
  'QL501_PRIVATE_ORIGINAL_TRIAL_SETUP_NOT_READY')));
 process.exitCode=2;
});
