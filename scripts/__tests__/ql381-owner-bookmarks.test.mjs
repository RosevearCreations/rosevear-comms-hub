import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const view=readFileSync(new URL('../../app/src/auth/OwnerIncidentHistory.tsx',import.meta.url),'utf8');
test('QL-381 bookmarks are bounded, session-only, and cannot become evidence of resolution',()=>{
  assert.match(view,/setBookmarks\(\[\]\);setBookmarkedOnly\(false\);setPreviousReview\(null\)/);
  assert.match(view,/\.slice\(-40\)/);
  assert.match(view,/activeBookmarks=bookmarks\.filter/);
  assert.match(view,/Restore previous filters/);
  assert.match(view,/event\.key==='Escape'/);
  assert.match(view,/Bookmark applies only to observed episodes in this open owner session/);
  assert.match(view,/not independent incident resolutions or six source confirmations/);
  assert.doesNotMatch(view,/\bfetch\s*\(|\.from\(|\.rpc\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(view,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|sendBeacon/);
});
