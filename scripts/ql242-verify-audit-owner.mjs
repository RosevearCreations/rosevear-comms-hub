#!/usr/bin/env node
/** CLI verification is local and fully offline; it never configures a pilot. */
import { readFile } from 'node:fs/promises';
import { createQl242Rehearsal, createQl242AuditInspector } from './ql242-gateway-audit-owner-rehearsal.mjs';

const option = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : null;
};
const file = option('--packet');
const gatewayPin = option('--gateway-pin-sha256');
const ownerPin = option('--owner-pin-sha256');
const rehearsal = process.argv.includes('--rehearse-and-rollback');
if (!file || !gatewayPin || !ownerPin) {
  process.stderr.write('Usage: node scripts/ql242-verify-audit-owner.mjs --packet ./local-nonsecret-signed-packet.json --gateway-pin-sha256 <out-of-band-public-SPKI-hash> --owner-pin-sha256 <separate-owner-public-SPKI-hash> [--rehearse-and-rollback]\n');
  process.stderr.write('Offline only: signature matching does NOT prove key provenance, actual owner authorization or safe real rollout.\n');
  process.exitCode = 2;
} else {
  try {
    const data = await readFile(file);
    if (data.length > 32_768) throw new Error('too large');
    const result = createQl242AuditInspector().inspect(JSON.parse(data.toString('utf8')), gatewayPin, ownerPin);
    const run = createQl242Rehearsal(result);
    const transitions = rehearsal ? [run.transition('prepare'), run.transition('rehearse'), run.transition('rollback')] : [];
    process.stdout.write(JSON.stringify({ ...result, transitions }, null, 2) + '\n');
    if (result.status !== 'DUAL_SIGNATURES_CHECKED_HELD') process.exitCode = 1;
  } catch {
    process.stderr.write('Packet could not be parsed. Do not include private signing keys, credentials, personal records or actual owner authorizations.\n');
    process.exitCode = 2;
  }
}
