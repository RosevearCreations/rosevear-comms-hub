import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const view=readFileSync(new URL('../../app/src/auth/OwnerIncidentHistory.tsx',import.meta.url),'utf8');
test('QL-382 saved views and progress remain bounded, private and non-authorizing',()=>{
  assert.match(view,/setSavedReviews\(\[\]\);nextSaveId\.current=1/);
  assert.match(view,/setSavedReviews\(current=>\[\.\.\.current,snapshot\]\.slice\(-5\)\)/);
  assert.match(view,/if\(!authenticated\)return/);
  assert.match(view,/saved\.reviewed\.filter\(sequence=>entries\.some/);
  assert.match(view,/markReviewed\(group\.occurrences\.map/);
  assert.match(view,/Progress means viewed here, not independently verified or resolved/);
  assert.match(view,/No messages sent, approvals granted, or incident status changed/);
  assert.doesNotMatch(view,/\bfetch\s*\(|\.from\(|\.rpc\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(view,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|sendBeacon/);
});
