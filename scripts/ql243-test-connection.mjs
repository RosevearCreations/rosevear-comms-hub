#!/usr/bin/env node
/** An opt-in CLI, never executed during app or production deploy. */
import { readFile } from 'node:fs/promises';
import { inspectQl243Identity, testQl243NonproductionConnection } from './ql243-secure-gateway-connection.mjs';

const arg = name => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const file = arg('--bundle');
const configFile = arg('--connection-config');
const pins = { gateway: arg('--gateway-pin-sha256'), owner: arg('--owner-pin-sha256'), witness: arg('--witness-pin-sha256') };
const connect = process.argv.includes('--allow-authenticated-nonproduction-gets');
if (!file || !Object.values(pins).every(Boolean) || (connect && !configFile)) {
  process.stderr.write('Usage: node scripts/ql243-test-connection.mjs --bundle ./local-public-evidence.json --gateway-pin-sha256 <sha256> --owner-pin-sha256 <sha256> --witness-pin-sha256 <sha256> [--connection-config ./local-nonsecret-connection.json --allow-authenticated-nonproduction-gets]\n');
  process.stderr.write('Offline identity signature comparison is default. Explicit authenticated GET mode requires ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64 in the server process environment (base64 of exactly 32 bytes). No writes or pilot approval.\n');
  process.exitCode = 2;
} else {
  try {
    const bytes = await readFile(file);
    if (bytes.byteLength > 32_768) throw new Error('oversized evidence');
    const bundle = JSON.parse(bytes.toString('utf8'));
    let outcome;
    if (connect) {
      const raw = process.env.ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64;
      if (!raw || !/^[A-Za-z0-9+/]{42}[A-Za-z0-9+/]=?$/.test(raw)) throw new Error('missing 32-byte env key');
      const key = Buffer.from(raw, 'base64');
      if (key.length !== 32 || key.toString('base64') !== raw) throw new Error('invalid 32-byte env key');
      const configBytes = await readFile(configFile);
      if (configBytes.byteLength > 8192) throw new Error('oversized config');
      outcome = await testQl243NonproductionConnection(bundle, pins, JSON.parse(configBytes.toString('utf8')), key);
      key.fill(0);
    } else {
      outcome = inspectQl243Identity(bundle, pins);
    }
    process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`);
    if (!['IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD', 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD'].includes(outcome.status)) process.exitCode = 1;
  } catch {
    process.stderr.write('Failed closed: local non-secret files, out-of-band witness pins and/or server-side test key are missing or invalid. Never paste credentials or customer data.\n');
    process.exitCode = 2;
  }
}
