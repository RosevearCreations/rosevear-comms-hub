import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const entries=[
  ['AI_DATA_PLATFORM_QL261.md','ai-data-platform'],
  ['DEVIL_N_DOVE_QL261.md','devilndove-site'],
  ['ROSIE_DAZZLERS_QL261.md','rosiedazzlers'],
  ['YARD_WORKERS_QL261.md','yw'],
  ['ICAMP_QL261.md','iCamp'],
  ['ROSEVEAR_AI_HUB_QL261.md','rosevear-ai-hub']
];
for(const [name,repo] of entries){
  const content=readFileSync(resolve(root,'docs/integration/ql261',name),'utf8');
  assert.match(content,new RegExp(`RosevearCreations/${repo}`));
  assert.match(content,/docs\/integration\/ql246-source-proof\.json/);
  assert.match(content,/QL-258/);
  assert.match(content,/DISCONNECTED \/ HOLD/);
  assert.match(content,/source commit A|source A|source commit A|audited source A|source commit A|immutable source A/i);
  assert.match(content,/proof commit B|proof B/i);
  assert.match(content,/nonproduction/i);
  assert.doesNotMatch(content,/!Sample12345|!Manage12345|!Admin12345|sk_live_|ghp_[A-Za-z\d]+/);
}
console.log(`QL-261 checked ${entries.length} original app-specific action documents, no live gateway calls.`);
