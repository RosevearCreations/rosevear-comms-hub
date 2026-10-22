/**
 * QL-165: a local fixture lock, not an attestation, signature or authorization.
 * Fingerprints detect accidental edits in the shipped synthetic preview. The
 * manifest is reviewed and versioned in source, never fetched or persisted.
 */
export const QL165_FIXTURE_SET_VERSION = 'ql093-local-fallback-v1' as const;
export const QL165_FIXTURE_SCHEMA_VERSION = 1 as const;

export type Ql165FixtureKind = 'conversation' | 'system-status';
export type Ql165FixtureManifestEntry = {
  id: string;
  kind: Ql165FixtureKind;
  revision: 1;
  fingerprint: string;
};

export type Ql165FixtureVerification = {
  setVersion: typeof QL165_FIXTURE_SET_VERSION;
  schemaVersion: typeof QL165_FIXTURE_SCHEMA_VERSION;
  verified: boolean;
  fixtureCount: number;
  failures: readonly string[];
};

// Explicit content pins. Updating a fixture requires a reviewed manifest
// revision and matching acceptance tests; do not auto-update these at runtime.
export const ql165FixtureManifest: readonly Ql165FixtureManifestEntry[] = [
  { id: 'rosie-ceramic-quote', kind: 'conversation', revision: 1, fingerprint: 'fnv1a64:ace161cd1161f7df' },
  { id: 'rosie-missed-call', kind: 'conversation', revision: 1, fingerprint: 'fnv1a64:55c996435de25fd4' },
  { id: 'devil-custom-order', kind: 'conversation', revision: 1, fingerprint: 'fnv1a64:d810aecf2ffe62ef' },
  { id: 'devil-maker-story', kind: 'conversation', revision: 1, fingerprint: 'fnv1a64:6cc83108ad066054' },
  { id: 'ql093-local-fallback-active', kind: 'system-status', revision: 1, fingerprint: 'fnv1a64:b9a50c2424cf7b5b' },
  { id: 'ql093-live-runtime-locked', kind: 'system-status', revision: 1, fingerprint: 'fnv1a64:d06ff4690efa214c' }
] as const;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

/** FNV-1a 64-bit over UTF-8; a reproducible drift marker, not a security hash. */
export function fingerprintQl165Fixture(value: unknown): string {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash = ((hash ^ BigInt(byte)) * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`;
}

type SyntheticFixture = { id: string; source: string };

export function verifyQl165SyntheticFixtures(
  conversations: readonly SyntheticFixture[],
  statuses: readonly SyntheticFixture[],
  declaredSetVersion: string = QL165_FIXTURE_SET_VERSION
): Ql165FixtureVerification {
  const failures: string[] = [];
  if (declaredSetVersion !== QL165_FIXTURE_SET_VERSION) {
    failures.push(`fixture set version mismatch: ${declaredSetVersion}`);
  }

  const expected = new Map(ql165FixtureManifest.map(entry => [`${entry.kind}:${entry.id}`, entry]));
  const seen = new Set<string>();

  for (const [kind, rows] of [
    ['conversation', conversations],
    ['system-status', statuses]
  ] as const) {
    for (const row of rows) {
      const key = `${kind}:${row.id}`;
      if (seen.has(key)) {
        failures.push(`duplicate fixture identity: ${key}`);
        continue;
      }
      seen.add(key);
      const pin = expected.get(key);
      if (!pin) {
        failures.push(`unrecognized fixture identity: ${key}`);
      } else if (row.source !== 'local_fallback') {
        failures.push(`unexpected fixture source: ${key}`);
      } else if (fingerprintQl165Fixture(row) !== pin.fingerprint) {
        failures.push(`fixture content drift: ${key}`);
      }
    }
  }

  for (const key of expected.keys()) {
    if (!seen.has(key)) failures.push(`missing fixture: ${key}`);
  }

  return {
    setVersion: QL165_FIXTURE_SET_VERSION,
    schemaVersion: QL165_FIXTURE_SCHEMA_VERSION,
    verified: failures.length === 0,
    fixtureCount: seen.size,
    failures
  };
}
