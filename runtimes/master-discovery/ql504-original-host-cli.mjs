/**
 * QL-504 original-host PRIVATE review entrypoint. No network, sender, service
 * installation, background scheduler, TEST receiver or secret-file read.
 * The intentionally disabled --drain-once CLI requires a separate owner-
 * authorized production worker/issuer gateway and cannot be activated in CI.
 */
import {join} from 'node:path';
import {ql504ReadOfflineStatus} from './ql504-private-receipt-worker.mjs';
const hold=reason=>({build:'QL-504',state:'HOLD',reason,
 providerConnected:false,receiverStarted:false,
 customerMessageSent:false,privateRuntimeEnrolled:false});
function originalHost(){
 return process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 process.env.USERNAME==='Ree';
}
const action=process.argv[2]??'--status';
let response;
if(action==='--status')response={
 build:'QL-504',state:'CODE_READY_PRIVATE_WORKER_NOT_ENROLLED',
 networkListening:false,automaticDispatch:false,receiverStarted:false,
 customerMessageSent:false,originalRuntimeVerified:false};
else if(action==='--inspect'){
 if(!originalHost()||!process.env.LOCALAPPDATA)
  response=hold('ORIGINAL_REE_WINDOWS_HOST_REQUIRED');
 else response=ql504ReadOfflineStatus(join(
  process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private',
  'ql504-signed-receipts.jsonl'));
}else response=hold('LIVE_WORKER_INVOCATION_NOT_AUTHORIZED_BY_THIS_CLI');
process.stdout.write(JSON.stringify(response)+'\n');
if(action!=='--status'&&response.state==='HOLD')process.exitCode=2;
