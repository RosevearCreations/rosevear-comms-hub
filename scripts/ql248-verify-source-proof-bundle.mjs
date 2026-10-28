#!/usr/bin/env node
/** Local-only public-source proof inspection; never fetches GitHub or gateways. */
import { readFile } from 'node:fs/promises';
import { inspectQl248Bundle } from './ql248-proof-commit-reconciliation.mjs';

const usage = 'Usage: node scripts/ql248-verify-source-proof-bundle.mjs --bundle ./public-ql248-bundle.json --trusted-pins ./independently-obtained-ql248-pins.json\n';
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== '--bundle' || args[2] !== '--trusted-pins' ||
  !args[1] || !args[3] || args[1] === args[3]) {
  process.stderr.write(usage + 'No network, owner authorization, key provisioning or gateway tests. Inputs must contain PUBLIC metadata only.\n');
  process.exitCode = 2;
} else {
  try {
    const [bundleBytes, pinsBytes] = await Promise.all([readFile(args[1]), readFile(args[3])]);
    if (bundleBytes.length > 196_608 || pinsBytes.length > 32_768)
      throw new Error('OVERSIZED_PUBLIC_INPUT');
    const result = inspectQl248Bundle(JSON.parse(bundleBytes.toString('utf8')),
      JSON.parse(pinsBytes.toString('utf8')));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status !== 'SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD')
      process.exitCode = 1;
  } catch {
    process.stderr.write('Invalid, missing or oversized public proof input; check file paths and schemas. No external request made.\n');
    process.exitCode = 2;
  }
}
