#!/usr/bin/env node
/** Owner-only read-only original Master configuration inventory; no TLS calls. */
import {resolve,isAbsolute} from 'node:path';
import {discoverQl500OriginalProviderConfig} from './ql500-original-provider-custody.mjs';
const owner=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 String(process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';
if(process.argv.length===3&&process.argv[2]==='--status'){
 console.log(JSON.stringify({state:'QL500_PROVIDER_DISCOVERY_OFF_BY_DEFAULT',
  originalHostCandidate:owner(),providerConfigInspected:false,
  originalLiveReceiptCertified:false,automaticNetworkSend:false,
  customerWrites:false}));
}else if(process.argv.length===3&&process.argv[2]==='--inventory'&&
 owner()&&process.env.LOCALAPPDATA&&isAbsolute(process.env.LOCALAPPDATA)){
 const directory=resolve(process.env.LOCALAPPDATA,'Rosevear','CommsHub','Private');
 const r=discoverQl500OriginalProviderConfig({directory});
 console.log(JSON.stringify({...r,originalHostCandidate:true,
  originalWindowsPhysicallyCertified:false}));
 if(r.state==='HOLD')process.exitCode=2;
}else{
 console.error(JSON.stringify({state:'HOLD',
  reason:'QL500_ORIGINAL_WINDOWS_OWNER_READ_ONLY_INVENTORY_ONLY',
  automaticNetworkSend:false,customerWrites:false}));
 process.exitCode=2;
}
