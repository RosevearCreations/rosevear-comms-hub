import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDiscoveryAudit} from './audit-result.mjs';
const sources=['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub'];
const entries=status=>sources.map(sourceId=>({sourceId,status,connected:false}));
test('unsigned six-source public discovery succeeds as code audit but never CONNECTED',()=>{
 const result=evaluateDiscoveryAudit(entries('DISCOVERED_UNSIGNED_HELD'));
 assert.equal(result.ci,'PASS');assert.equal(result.operational,'HOLD');
});
test('GitHub transport failures are explicitly deferred operational HOLD, not synthetic discovery',()=>{
 const r=evaluateDiscoveryAudit(entries('SOURCE_COMMIT_UNAVAILABLE_HELD'));
 assert.equal(r.ci,'PASS');assert.equal(r.operational,'HOLD');
 assert.equal(r.deferred.length,6);
});
test('security DENY, missing source, duplicate source or unsafe connection fail CI',()=>{
 const d=entries('DISCOVERED_UNSIGNED_HELD');d[0].status='DENY_INVALID_SIGNATURE';
 assert.equal(evaluateDiscoveryAudit(d).ci,'FAIL');
 const m=entries('DISCOVERED_UNSIGNED_HELD').slice(1);
 assert.equal(evaluateDiscoveryAudit(m).ci,'FAIL');
 const p=entries('DISCOVERED_UNSIGNED_HELD');p[0].connected=true;
 assert.equal(evaluateDiscoveryAudit(p).ci,'FAIL');
 const dup=entries('DISCOVERED_UNSIGNED_HELD');dup[0].sourceId=dup[1].sourceId;
 assert.equal(evaluateDiscoveryAudit(dup).ci,'FAIL');
});
