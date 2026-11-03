import { QL303_ROWS, ql303AgeDays } from './ql303CapabilityReadiness';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';

export type Ql323Scenario = 'unobserved' | 'offline' | 'timeout' | 'invalid' | 'stale' | 'fixture_recovered';
export type Ql323Assessment = {
  scenario: Ql323Scenario;
  label: string;
  outcome: string;
  explanation: string;
  actions: readonly string[];
  liveHealthVerified: false;
  providerRequests: 0;
  autoRestartAttempts: 0;
  connection: 'DISCONNECTED / HOLD';
};

export const QL323_SCENARIOS: readonly { id: Ql323Scenario; label: string }[] = [
  { id: 'unobserved', label: 'Unobserved / unknown' },
  { id: 'offline', label: 'Offline scenario' },
  { id: 'timeout', label: 'Timeout scenario' },
  { id: 'invalid', label: 'Invalid response scenario' },
  { id: 'stale', label: 'Stale snapshot scenario' },
  { id: 'fixture_recovered', label: 'Fixture recovery rehearsal' }
];

const guidance: Record<Ql323Scenario, Pick<Ql323Assessment, 'label' | 'outcome' | 'explanation' | 'actions'>> = {
  unobserved: { label: 'UNKNOWN · NO LIVE TELEMETRY', outcome: 'No current source-health observation', explanation: 'A loaded preview and an old public proof receipt cannot establish that any external application is healthy.', actions: ['Review the dated source-proof evidence in I.T. Command.', 'Obtain a fresh independent observation outside this disabled preview.', 'Keep connection and TEST gates on HOLD until separately authorized.'] },
  offline: { label: 'OFFLINE · FICTIONAL FAILURE', outcome: 'Simulated source not reachable', explanation: 'No actual provider was contacted. In this rehearsal the source is unreachable and dependants must not assume successful delivery.', actions: ['Record the affected source and simulated failure in an unsent owner review.', 'Check local connectivity and the provider status through independently authorized channels.', 'Keep work queued locally; do not dispatch, restart or replay automatically.'] },
  timeout: { label: 'TIMEOUT · FICTIONAL FAILURE', outcome: 'Simulated source did not respond in time', explanation: 'No timeout was observed on a real request; the scenario demonstrates a safe pending state rather than a successful response.', actions: ['Review the documented timeout and retry budget without creating traffic.', 'Escalate persistent timeouts to an authorized operator.', 'Do not retry a private gateway or interpret silence as a successful ACK.'] },
  invalid: { label: 'INVALID · FICTIONAL RESPONSE', outcome: 'Simulated source contract rejected', explanation: 'The sample response is missing required structure. Rejection of a fixture is not proof that a real source is defective.', actions: ['Inspect the expected synthetic contract in I.T. / Connection evidence.', 'Ask a reviewer to compare a sanitized, authorized response out of band.', 'Retain the source on HOLD; do not accept unknown tenant or permission fields.'] },
  stale: { label: 'STALE · FIXTURE OBSERVATION', outcome: 'Previously recorded proof is no longer current', explanation: 'The proof is dated and not continuously refreshed. Age does not imply a new HTTP result or live application outage.', actions: ['Read the original observation date and immutable commit pin.', 'Request a new independent credential-free public proof check when authorized.', 'Do not promote a stale source to GREEN or fill missing timestamps with today’s date.'] },
  fixture_recovered: { label: 'REHEARSAL CLEAR · STILL UNVERIFIED', outcome: 'Only the simulated error was cleared', explanation: 'The demonstration reset succeeded in this browser tab. External health, tenant access, and provider recovery remain unknown.', actions: ['Confirm this is only a fixture state reset.', 'Retain DISCONNECTED / HOLD pending original proof and owner approval.', 'Require a separately witnessed recovery before claiming real service restoration.'] }
};

export function ql323Assess(scenario: string): Ql323Assessment {
  const safe = Object.prototype.hasOwnProperty.call(guidance, scenario) ? scenario as Ql323Scenario : 'unobserved';
  return { scenario: safe, ...guidance[safe], liveHealthVerified: false, providerRequests: 0, autoRestartAttempts: 0, connection: 'DISCONNECTED / HOLD' };
}

export const QL323_DEPENDENCIES = QL270_SOURCES.map(source => ({
  id: source.id, label: source.label, kind: source.kind, scope: source.scope,
  via: source.kind === 'Business app' ? 'Separate proposed business intake boundary' : source.kind === 'Shared service' ? 'Optional future reporting boundary' : 'Private optional Windows relay boundary',
  link: 'PLANNED ONLY · DISCONNECTED / HOLD' as const
}));

/** Historic public-proof observations are evidence, not live source-health probes. */
export function ql323SourceEvidence(now: Date) {
  return QL303_ROWS.map(source => {
    const daysOld = ql303AgeDays(source.observedAt, now);
    return {
      id: source.id as Ql270SourceId, label: source.label, kind: source.kind,
      observedAt: source.observedAt, observedHttp: source.observedHttp,
      daysOld, age: daysOld === null ? 'Age unknown / clock review' : `${daysOld} full day${daysOld === 1 ? '' : 's'} old`,
      freshness: daysOld === null ? 'UNKNOWN / CLOCK REVIEW' : daysOld >= 1 ? 'STALE · RECHECK NEEDED' : 'DATED SNAPSHOT · NOT LIVE',
      health: 'UNKNOWN / NOT MONITORED' as const,
      connection: 'DISCONNECTED / HOLD' as const,
      originalProof: source.observedHttp === 404 ? 'HTTP 404 AT PINNED PROOF' : 'UNVERIFIED PUBLIC RESPONSE'
    };
  });
}

export const QL323_RELEASE_EVIDENCE = {
  lastVerifiedSoftware: 'QL-322',
  sourceCommit: '15651e437bd54528aa87ffa06c7b1250e1012ba0',
  receiptPath: 'docs/build-records/QL-322_STATISTICAL_TRENDS_PARITY_FRESHNESS.md',
  release: 'DOCUMENTED SOFTWARE ONLY · NO RUNTIME HEALTH ASSERTION' as const,
  observedRuntimeAt: null as null
};
