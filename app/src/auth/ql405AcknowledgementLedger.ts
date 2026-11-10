import {QL375_SHELLS} from './ql375OwnerStatus';
import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';

/** QL-405. Nonsecret, manually reviewed GitHub evidence snapshot. It is never a
 * live source probe, authenticated owner record or signed connection receipt. */
export const QL405_CAPTURED_AT='2026-11-10T05:08:23Z';
export const QL405_MAX_SNAPSHOT_AGE_MS=60*60*1000;
export type QL405SourceId=(typeof QL375_SHELLS)[number]['id'];
export type QL405Evidence={
  sourceId:QL405SourceId;
  acknowledgedRevision:string;
  observedMainRevision:string;
  manifestRevision:string;
  manifestPath:string;
  handlerPath:string;
  manifestConnection:'DISCONNECTED / HOLD';
  ownerProof:'HOLD';
  signedReceipt:'HOLD';
};

export const QL405_PUBLIC_EVIDENCE:readonly QL405Evidence[]=Object.freeze([
  {sourceId:'yw',acknowledgedRevision:'e51cf098aec6d49699645bc2d8ccbd2d756d579d',
    observedMainRevision:'e51cf098aec6d49699645bc2d8ccbd2d756d579d',
    manifestRevision:'028aee250857415b9b9035aaec50060757e377a5',
    manifestPath:'public/.well-known/rosevear-integration-manifest.json',handlerPath:'server/ql364-source-health.mjs',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'},
  {sourceId:'icamp',acknowledgedRevision:'b59fa045cb26f441aa32b890ba6c979c34045ce5',
    observedMainRevision:'b59fa045cb26f441aa32b890ba6c979c34045ce5',
    manifestRevision:'dc1369338a4b191fc72031b7e62f7e48fd805bcd',
    manifestPath:'public/.well-known/rosevear-integration-manifest.json',handlerPath:'lib/integration-v1/ql364-source-health.mjs',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'},
  {sourceId:'rosiedazzlers',acknowledgedRevision:'91148a6a9beb127f04c7e8719119910709030448',
    observedMainRevision:'91148a6a9beb127f04c7e8719119910709030448',
    manifestRevision:'83b03717b828ac70984a5f9279cd05d9f163faae',
    manifestPath:'.well-known/rosevear-integration-manifest.json',handlerPath:'functions/api/_lib/ql364-source-health.mjs',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'},
  {sourceId:'devilndove',acknowledgedRevision:'d8ddee1d288e7db874cbf07448c79fe941f40f5e',
    observedMainRevision:'d8ddee1d288e7db874cbf07448c79fe941f40f5e',
    manifestRevision:'1f0e220b0cf7aff2dfeb650c96304d96502ede54',
    manifestPath:'.well-known/rosevear-integration-manifest.json',handlerPath:'functions/api/_lib/ql364-source-health.mjs',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'},
  {sourceId:'ai-data-platform',acknowledgedRevision:'1988018a6bc4f54b58baabc7e810ae5b0be4d7a4',
    observedMainRevision:'34011c649aea00494df265f97ec8baeb66a7e6bb',
    manifestRevision:'cb573c1ac4610fb6e438da6534db2be6cea93499',
    manifestPath:'apps/web/public/.well-known/rosevear-integration-manifest.json',
    handlerPath:'apps/web/lib/ql364-source-health.mjs',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'},
  {sourceId:'rosevear-ai-hub',acknowledgedRevision:'ecfa48707fc34d00cab8d94a4ccb226653c9e13b',
    observedMainRevision:'125b7371d73bbaa6ef418edb75a53934e34ad0cd',
    manifestRevision:'be99d882d6b75310b948911a81b2dcb5f3a3629e',
    manifestPath:'apps/web/public/.well-known/rosevear-integration-manifest.json',
    handlerPath:'server/src/rosevear_ai_hub/api/ql364_source_health.py',
    manifestConnection:'DISCONNECTED / HOLD',ownerProof:'HOLD',signedReceipt:'HOLD'}
]);

const SHA=/^[a-f0-9]{40}$/;
const MANIFEST_PATHS:Record<QL405SourceId,string>={
  yw:'public/.well-known/rosevear-integration-manifest.json',
  icamp:'public/.well-known/rosevear-integration-manifest.json',
  rosiedazzlers:'.well-known/rosevear-integration-manifest.json',
  devilndove:'.well-known/rosevear-integration-manifest.json',
  'ai-data-platform':'apps/web/public/.well-known/rosevear-integration-manifest.json',
  'rosevear-ai-hub':'apps/web/public/.well-known/rosevear-integration-manifest.json'
};
export type QL405Row=QL405Evidence&{
  name:string;repository:string;
  acknowledgement:'MATCH_AT_CAPTURE'|'STALE_AT_CAPTURE';
  manifestPin:'MATCH_AT_CAPTURE'|'REVIEW_REVISION_MISMATCH';
  connection:'HOLD';
};
export type QL405Filter='ALL'|'MATCH_AT_CAPTURE'|'STALE_AT_CAPTURE';

/** Public metadata and copy/pasted acknowledgements never upgrade trust. */
export function reviewQl405Acknowledgements(
  evidence:readonly QL405Evidence[], capturedAt:string, nowMs:number
){
  const capturedMs=Date.parse(capturedAt);
  const validTime=Number.isFinite(nowMs)&&Number.isFinite(capturedMs)&&nowMs>=capturedMs;
  const snapshotAge=validTime&&nowMs-capturedMs<=QL405_MAX_SNAPSHOT_AGE_MS?
    'RECENT_SNAPSHOT':'STALE_OR_UNVERIFIED_SNAPSHOT';
  if(evidence.length!==QL375_SHELLS.length||new Set(evidence.map(item=>item.sourceId)).size!==6||
    evidence.some(item=>{
      const registered=QL375_SHELLS.find(shell=>shell.id===item.sourceId);
      const handler=MASTER_SHELL_REGISTRY.find(shell=>shell.id===item.sourceId)?.handler;
      return !registered||!SHA.test(item.acknowledgedRevision)||
        !SHA.test(item.observedMainRevision)||!SHA.test(item.manifestRevision)||
        item.manifestConnection!=='DISCONNECTED / HOLD'||item.ownerProof!=='HOLD'||
        item.signedReceipt!=='HOLD'||item.manifestPath!==MANIFEST_PATHS[item.sourceId]||
        item.handlerPath!==handler;
    }))return {state:'INVALID_PUBLIC_EVIDENCE_HOLD' as const,age:snapshotAge,
      rows:[] as QL405Row[],ackMatches:0,ackDrift:0,manifestPinDrift:0,
      individuallyVerified:0,connected:0,persisted:false,networkRequests:0};
  const rows:QL405Row[]=evidence.map(item=>{
    const shell=QL375_SHELLS.find(shell=>shell.id===item.sourceId)!;
    return {...item,name:shell.name,repository:shell.repository,
      acknowledgement:item.acknowledgedRevision===item.observedMainRevision?
        'MATCH_AT_CAPTURE':'STALE_AT_CAPTURE',
      manifestPin:item.manifestRevision===item.observedMainRevision?
        'MATCH_AT_CAPTURE':'REVIEW_REVISION_MISMATCH',connection:'HOLD'};
  });
  return {state:'PUBLIC_SNAPSHOT_CONNECTION_HELD' as const,age:snapshotAge,rows,
    ackMatches:rows.filter(row=>row.acknowledgement==='MATCH_AT_CAPTURE').length,
    ackDrift:rows.filter(row=>row.acknowledgement==='STALE_AT_CAPTURE').length,
    manifestPinDrift:rows.filter(row=>row.manifestPin==='REVIEW_REVISION_MISMATCH').length,
    individuallyVerified:0,connected:0,persisted:false,networkRequests:0};
}

export function filterQl405Acknowledgements(rows:readonly QL405Row[],filter:QL405Filter){
  return filter==='ALL'?rows:rows.filter(row=>row.acknowledgement===filter);
}
