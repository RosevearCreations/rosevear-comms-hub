#!/usr/bin/env node
/** Strictly OFFLINE public-metadata signature/chain check; never a pilot activation. */
import { readFile } from 'node:fs/promises';
import { inspectQl245Packet } from './ql245-six-app-evidence-review.mjs';

const flag = name => {
  const idx=process.argv.indexOf(name);
  return idx<0 ? null : process.argv[idx+1];
};
const packetPath=flag('--packet'); const pinsPath=flag('--independently-sourced-pins');
if(!packetPath||!pinsPath) {
  process.stderr.write('Usage: node scripts/ql245-verify-six-app-evidence.mjs --packet ./public-ql245-returns.json --independently-sourced-pins ./trusted-public-pins.json\n');
  process.stderr.write('Both inputs are public metadata only. Never supply HMAC credentials, private keys, bearer tokens, owner documents or customer records. This does NOT establish source identity, connectivity or owner approval.\n');
  process.exitCode=2;
} else {
  try {
    const [publicBytes,pinBytes]=await Promise.all([readFile(packetPath),readFile(pinsPath)]);
    if(publicBytes.length>131072||pinBytes.length>16384)throw new Error('oversize');
    const result=inspectQl245Packet(JSON.parse(publicBytes.toString('utf8')),
      JSON.parse(pinBytes.toString('utf8')));
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(result.status!=='SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD')process.exitCode=1;
  } catch {
    process.stderr.write('Rejected malformed, oversized or missing public metadata. No external request was made.\n');
    process.exitCode=2;
  }
}
