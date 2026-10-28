#!/usr/bin/env node
/** Local, non-secret and OFFLINE. No owner authorization or connection config. */
import { readFile } from 'node:fs/promises';
import { inspectQl244Packet } from './ql244-witnessed-handshake-review.mjs';

const opt = flag => { const i = process.argv.indexOf(flag); return i < 0 ? null : process.argv[i + 1]; };
const file = opt('--packet');
const pins = { gateway: opt('--gateway-pin-sha256'), owner: opt('--owner-pin-sha256'),
  witness: opt('--witness-pin-sha256'), assessor: opt('--assessor-pin-sha256') };
if (!file || !Object.values(pins).every(Boolean)) {
  process.stderr.write('Usage: node scripts/ql244-verify-conditional-review.mjs --packet ./local-ql244-public-review.json --gateway-pin-sha256 <public-hash> --owner-pin-sha256 <public-hash> --witness-pin-sha256 <public-hash> --assessor-pin-sha256 <public-hash>\n');
  process.stderr.write('OFFLINE only. Four public fingerprints must be verified out-of-band. Does not establish identity, transfer credentials, authorize a pilot or send network requests.\n');
  process.exitCode = 2;
} else {
  try {
    const data = await readFile(file);
    if (data.byteLength > 65_536) throw new Error('too large');
    const result = inspectQl244Packet(JSON.parse(data.toString('utf8')), pins);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status !== 'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD') process.exitCode = 1;
  } catch {
    process.stderr.write('Rejected: missing/oversized/invalid public metadata packet. Never send secret keys, tokens, customer data, owner identity documents or real approval credentials.\n');
    process.exitCode = 2;
  }
}
