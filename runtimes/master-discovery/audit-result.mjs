/** A source network outage is a fail-closed operational HOLD, not proof of a
 * malformed local contract. A DENY is a security failure and fails CI. */
const EXPECTED=new Set(['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']);
export function evaluateDiscoveryAudit(results){
  if(!Array.isArray(results)||results.length!==EXPECTED.size||
    results.some(r=>!r||!EXPECTED.has(r.sourceId))||
    new Set(results.map(r=>r.sourceId)).size!==EXPECTED.size)
    return {ci:'FAIL',operational:'HOLD',reason:'INVALID_SIX_SOURCE_INVENTORY'};
  if(results.some(r=>typeof r.status!=='string'||r.connected!==false||
    r.status.startsWith('DENY_')))
    return {ci:'FAIL',operational:'HOLD',reason:'INVALID_OR_SECURITY_DENIED_DISCOVERY'};
  if(results.every(r=>r.status==='DISCOVERED_UNSIGNED_HELD'))
    return {ci:'PASS',operational:'HOLD',reason:'ALL_SIX_PUBLIC_MANIFESTS_UNSIGNED_HELD'};
  const deferredStatuses=new Set([
    'SOURCE_COMMIT_UNAVAILABLE_HELD','SOURCE_UNREACHABLE_HELD',
    'SOURCE_HTTP_404_HELD','SOURCE_HTTP_409_HELD','SOURCE_HTTP_429_HELD',
    'SOURCE_HTTP_FAILURE_HELD','NO_INDEPENDENT_TRUST_PIN_HELD',
    'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD'
  ]);
  if(results.every(r=>r.status==='DISCOVERED_UNSIGNED_HELD'||deferredStatuses.has(r.status)))
    return {ci:'PASS',operational:'HOLD',reason:'SOURCE_DISCOVERY_NETWORK_OR_AUTHORITY_DEFERRED',
      deferred:results.filter(r=>r.status!=='DISCOVERED_UNSIGNED_HELD').map(r=>r.sourceId)};
  return {ci:'FAIL',operational:'HOLD',reason:'UNKNOWN_DISCOVERY_RESULT'};
}
