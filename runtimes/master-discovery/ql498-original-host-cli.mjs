#!/usr/bin/env node
/** QL498 original Windows read-only release readiness. No network or secrets. */
const originalHost=process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 String(process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
if(process.argv.length!==3||process.argv[2]!=='--status'){
 console.error(JSON.stringify({state:'HOLD',
  reason:'QL498_ACTIVATION_NOT_SUPPORTED_BY_READ_ONLY_CLI'}));
 process.exitCode=2;
}else{
 console.log(JSON.stringify({
  state:'QL498_MASTER_RUNTIME_ACTIVATION_NOT_ENROLLED',
  originalHostCandidate:originalHost,
  masterServiceActivationCertified:false,
  originalDeviceCertified:false,
  independentProviderCeremonyCompleted:false,
  crossHostOriginalReceiptCertified:false,
  endToEndDeliveryCertified:false,
  automaticNetworkSend:false,customerWrites:false,
  requiredAction:'INDEPENDENT_PROVIDER_AND_ORIGINAL_HOST_FIELD_EVIDENCE'}));
}
