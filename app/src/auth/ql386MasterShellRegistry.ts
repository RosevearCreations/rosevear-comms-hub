import {QL375_SHELLS} from './ql375OwnerStatus';

/** Immutable QL-365D source identity contract. This registry describes expected
 * interfaces; matching an entry does not attest enrollment or connectivity. */
const handlers={
  yw:'server/ql364-source-health.mjs',
  icamp:'lib/integration-v1/ql364-source-health.mjs',
  rosiedazzlers:'functions/api/_lib/ql364-source-health.mjs',
  devilndove:'functions/api/_lib/ql364-source-health.mjs',
  'ai-data-platform':'apps/web/lib/ql364-source-health.mjs',
  'rosevear-ai-hub':'server/src/rosevear_ai_hub/api/ql364_source_health.py'
} as const;

export const MASTER_SHELL_REGISTRY=QL375_SHELLS.map(shell=>Object.freeze({
  ...shell,handler:handlers[shell.id],identityScope:'shell' as const,
  connectionAuthority:'separate source-owner evidence required' as const
}));

export type SourceIdentityClaim={sourceId:string;repository:string;handler:string};
export type SourceIdentityResult={sourceId:string;state:'MATCH'|'MISSING'|'DRIFT'|'DUPLICATE';reason:string};

/** Reconcile only identity metadata, never a connection or security decision. */
export function reconcileSourceIdentities(claims:readonly SourceIdentityClaim[]):SourceIdentityResult[]{
  const results:SourceIdentityResult[]=MASTER_SHELL_REGISTRY.map(expected=>{
    const matches=claims.filter(claim=>claim.sourceId===expected.id);
    if(matches.length===0)return {sourceId:expected.id,state:'MISSING',reason:'No source identity metadata supplied'};
    if(matches.length!==1)return {sourceId:expected.id,state:'DUPLICATE',reason:'Multiple claims use this fixed source ID'};
    const claim=matches[0];
    if(claim.repository!==expected.repository||claim.handler!==expected.handler)
      return {sourceId:expected.id,state:'DRIFT',reason:'Repository or source-health handler differs from the approved shell contract'};
    return {sourceId:expected.id,state:'MATCH',reason:'Identity metadata matches; connection and owner authorization remain unverified'};
  });
  for(const unknown of new Set(claims.filter(claim=>!MASTER_SHELL_REGISTRY.some(expected=>expected.id===claim.sourceId)).map(claim=>claim.sourceId)))
    results.push({sourceId:unknown,state:'DRIFT',reason:'Unknown source ID is outside the fixed six-shell registry'});
  return results;
}
