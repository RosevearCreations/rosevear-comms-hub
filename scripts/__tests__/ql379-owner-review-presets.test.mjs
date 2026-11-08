import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
test('QL-379 review shortcuts are session-only and offer bounded status choices',()=>{
  const presets=read('app/src/auth/ql379OwnerReviewPresets.ts');
  const view=read('app/src/auth/OwnerIncidentHistory.tsx');
  for(const label of ['All alerts','Action needed','Still displayed','No longer displayed'])assert.match(view,new RegExp(label));
  assert.match(view,/setSelected\(null\)/);
  assert.match(view,/setSearch\(''\);setSelected\(null\)/);
  assert.match(view,/aria-label="Session review shortcuts"/);
  assert.match(presets,/status:'showing',severity:'action'/);
  assert.match(presets,/status:'ended',severity:'all'/);
  for(const source of [presets,view]){
    assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|BroadcastChannel|WebSocket|sendBeacon/);
    assert.doesNotMatch(source,/\bfetch\s*\(|\.rpc\(|\.insert\(|\.update\(|\.delete\(/);
  }
});
