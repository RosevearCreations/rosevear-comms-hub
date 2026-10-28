#!/usr/bin/env node
/** Explicit developer-side proof retrieval; never bundled into the application. */
import { readFile } from 'node:fs/promises';
import { retrieveQl241NonproductionProof } from './ql241-external-gateway-retrieval.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : null;
}

const configPath = option('--config');
const outOfBandPin = option('--pin-sha256');
const ack = process.argv.includes('--allow-nonproduction-https-get');
if (!configPath || !outOfBandPin || !ack) {
  process.stderr.write('Usage: node scripts/ql241-retrieve-proofs.mjs --config ./local-nonsecret-config.json --pin-sha256 <out-of-band-SPKI-SHA256-hex> --allow-nonproduction-https-get\n');
  process.stderr.write('Requires exact independent public-key fingerprint; sends only two credential-free nonproduction HTTPS GETs. No owner approval or connector activation.\n');
  process.exitCode = 2;
} else {
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const result = await retrieveQl241NonproductionProof(config, outOfBandPin);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'SIGNED_GET_PAIR_CHECKED_HELD') process.exitCode = 1;
  } catch {
    process.stderr.write('Local config could not be loaded. Do not paste keys, tokens, personal records or server responses into this CLI.\n');
    process.exitCode = 2;
  }
}
