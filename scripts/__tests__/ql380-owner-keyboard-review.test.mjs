import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
test('QL-380 retains safe session boundaries and accessible keyboard review',()=>{
  const view=read('app/src/auth/OwnerIncidentHistory.tsx');
  assert.match(view,/event\.key==='Home'/);
  assert.match(view,/event\.key==='End'/);
  assert.match(view,/event\.preventDefault\(\)/);
  assert.match(view,/buttons\[next\]\?\.focus\(\)/);
  assert.match(view,/aria-describedby="ql380-keyboard-help"/);
  assert.match(view,/not independent incident resolutions or six source confirmations/);
  assert.match(view,/const entries=authenticated\?history\.observations:\[\]/);
  assert.doesNotMatch(view,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|sendBeacon|\bfetch\s*\(/);
});
