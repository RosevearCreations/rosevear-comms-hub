#!/usr/bin/env node
/** Static dated GitHub-only snapshot; no private network or scheduled activity. */
import { ql256CurrentHeldSnapshot,QL256_OBSERVED_AT,QL256_PUBLIC_PROOF_PATH }
  from './ql256-connection-readiness.mjs';
const result=ql256CurrentHeldSnapshot();
process.stdout.write(JSON.stringify({source:'QL-255 independently checked immutable public GitHub snapshot',
  observedAtUtc:QL256_OBSERVED_AT,proofPath:QL256_PUBLIC_PROOF_PATH,
  note:'Dated public snapshot; run QL-255 public-get command for a fresh public-only check. No credentials or gateway requests.',
  ...result},null,2)+'\n');
