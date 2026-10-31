import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL277_OBSERVED_AT } from './ql277DriftReview';
import { QL278_CUSTODY_PRECONDITIONS, QL278_PUBLIC_SOURCE_RECHECK,
  type Ql278RetestTicket } from './ql278FollowupDesk';

/** Actual public, read-only main-ref GETs and pinned original Proof-B path GETs.
 * Neither signer/custodian endpoints nor any app gateway were accessed. */
export const QL279_OBSERVED_AT = '2026-10-31T02:33:44Z';
export const QL279_PUBLIC_SOURCE_RECHECK = [
  { source: 'ai-data-platform', repo: 'ai-data-platform', sha: '73842314ae77af0826c6403d851dbdd58ae964fe', http: 404 },
  { source: 'devilndove', repo: 'devilndove-site', sha: '1c3ae46467d2604315c42d0f6515a636129b1928', http: 404 },
  { source: 'rosiedazzlers', repo: 'rosiedazzlers', sha: '00727561f2ebba36a3a171e0fe5624e35f9b0ad5', http: 404 },
  { source: 'yw', repo: 'yw', sha: '736c79f0ef76375b4ceea2db5921cabfc0c90fe9', http: 404 },
  { source: 'icamp', repo: 'iCamp', sha: '883ee518e805253f45c316ce380ba13723182ff3', http: 404 },
  { source: 'rosevear-ai-hub', repo: 'rosevear-ai-hub', sha: '11861c13801b395d9be7f8a661fe7ebf8bc25fd5', http: 404 }
] as const satisfies ReadonlyArray<{source: Ql270SourceId; repo: string; sha: string; http: number}>;

const DAY_MS = 86_400_000;
function validClock(now: Date) { return Number.isFinite(now.getTime()); }
function elapsedHours(from: string, asOf: Date | string) {
  const difference = new Date(asOf).getTime() - new Date(from).getTime();
  return Number.isFinite(difference) && difference >= 0 ? Math.floor(difference / 3_600_000) : null;
}
function referenceProblem(value: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value.trim()))
    return 'Enter a non-secret claim reference of 5–32 letters, digits, dashes or underscores.';
  if (/^(?:sk[-_]|pk[-_]|secret|password|token|bearer|api[-_]?key)/i.test(value.trim()))
    return 'Secret-like references are not permitted.';
  return null;
}
function observationProblem(value: string) {
  const note = value.trim().replace(/\s+/g,' ');
  if (note.length < 8 || note.length > 240) return 'Use 8–240 characters describing only non-sensitive review context.';
  if (/https?:|www\.|@|\b(?:password|secret|token|bearer|api[_ -]?key|credential|private key)\b/i.test(note))
    return 'Remove URLs, personal contact details and credential-like content.';
  return null;
}

export function ql279PinnedProofUrl(source: Ql270SourceId) {
  const row = QL279_PUBLIC_SOURCE_RECHECK.find(entry=>entry.source===source);
  if (!row) throw Error('UNKNOWN_QL279_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql279SourceWatch(asOf: Date | string) {
  const observedAgeHours = elapsedHours(QL279_OBSERVED_AT, asOf);
  const trackedHours = elapsedHours(QL277_OBSERVED_AT, asOf);
  const freshness = observedAgeHours === null ? 'CLOCK_REVIEW' as const :
    observedAgeHours >= 24 ? 'PUBLIC_RECHECK_DUE' as const : 'PINNED_RECENT' as const;
  const escalation = trackedHours === null ? 'CLOCK_REVIEW' as const : trackedHours >= 48 ? 'ESCALATION_REVIEW_DUE' as const :
    trackedHours >= 24 ? 'FOLLOW_UP_DUE' as const : 'MONITOR' as const;
  const rows = QL279_PUBLIC_SOURCE_RECHECK.map(entry=>{
    const old = QL278_PUBLIC_SOURCE_RECHECK.find(row=>row.source===entry.source);
    return { ...entry, previousSha:old?.sha??null, moved:old?.sha!==entry.sha,
      proof:'ORIGINAL_PROOF_NOT_PUBLISHED_AT_PIN' as const,
      custody:'ORIGINAL_CUSTODY_NOT_VERIFIED' as const,
      witness:'ORIGINAL_WITNESS_NOT_VERIFIED' as const,
      escalation, notification:'DRAFT_NOT_SENT' as const };
  });
  return { rows, observedAgeHours, trackedHours, freshness, escalation,
    nextPublicCheckDueAt:new Date(new Date(QL279_OBSERVED_AT).getTime()+DAY_MS).toISOString(),
    changed:rows.filter(row=>row.moved).length, unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length, sources:QL270_SOURCES.length,
    originalReceiptsVerified:0, independentDispositionsAccepted:0, noticesSent:0,
    release:'DISCONNECTED / HOLD' as const };
}

export type Ql279ReviewerDecision = 'RETEST_REQUIRED' | 'EVIDENCE_INCOMPLETE' | 'NO_ISSUE_CLAIM_NEEDS_WITNESS';
export type Ql279ReviewerDraft = {checkId: Ql278RetestTicket['checkId']; priority: Ql278RetestTicket['priority'];
  retestRecordedAt: string | null; reviewerReferenceClaim: string; decision: Ql279ReviewerDecision;
  sanitizedNote: string; preparedAt: string; actor:'INDEPENDENT_REVIEWER_CLAIM';
  authentication:'NOT_AUTHENTICATED'; disposition:'REVIEW_DRAFT_ONLY'; closure:'OPEN';
  accepted:false; state:'DRAFT_NOT_SENT'};

export function ql279PrepareReviewerDraft(ticket: Ql278RetestTicket, reviewerReference: string,
  decision: Ql279ReviewerDecision, note: string, now: Date):
  {ok:true; draft:Ql279ReviewerDraft}|{ok:false; reason:string} {
  if (!ticket || !['HIGH_REGRESSION','UNRESOLVED_ISSUE','ENVIRONMENT_RECHECK','TIME_ORDER_REVIEW'].includes(ticket.priority) ||
    ticket.disposition!=='INDEPENDENT_REVIEW_REQUIRED' || ticket.accepted!==false)
    return {ok:false,reason:'Choose a genuine open, unverified QL-278 retest ticket.'};
  if (!validClock(now)) return {ok:false,reason:'A valid local preparation time is required.'};
  const refError=referenceProblem(reviewerReference); if(refError) return {ok:false,reason:refError};
  const noteError=observationProblem(note); if(noteError) return {ok:false,reason:noteError};
  if (!['RETEST_REQUIRED','EVIDENCE_INCOMPLETE','NO_ISSUE_CLAIM_NEEDS_WITNESS'].includes(decision))
    return {ok:false,reason:'Select a supported unverified reviewer outcome.'};
  if (decision==='NO_ISSUE_CLAIM_NEEDS_WITNESS' && ticket.retest?.outcome!=='observed')
    return {ok:false,reason:'A later comparable no-issue retest must be recorded before drafting this outcome.'};
  return {ok:true,draft:{checkId:ticket.checkId,priority:ticket.priority,
    retestRecordedAt:ticket.retest?.recordedAt??null,reviewerReferenceClaim:reviewerReference.trim(),
    decision,sanitizedNote:note.trim().replace(/\s+/g,' '),preparedAt:now.toISOString(),
    actor:'INDEPENDENT_REVIEWER_CLAIM',authentication:'NOT_AUTHENTICATED',
    disposition:'REVIEW_DRAFT_ONLY',closure:'OPEN',accepted:false,state:'DRAFT_NOT_SENT'}};
}

export type Ql279ArrivalKind='SOURCE_PUBLICATION_NOTICE'|'CUSTODIAN_ORIGINAL_RETURN_NOTICE'|'WITNESS_ORIGINAL_RETURN_NOTICE';
export type Ql279ArrivalClaim = {source:Ql270SourceId; sha:string; kind:Ql279ArrivalKind;
  referenceClaim:string; preparedAt:string; notice:'CLAIMED_NOT_CONFIRMED';
  originalVerified:false; evidence:'PUBLIC_PROOF_404_CUSTODY_UNVERIFIED';
  state:'DRAFT_NOT_SENT'};

export function ql279PrepareArrivalClaim(source: Ql270SourceId, kind: Ql279ArrivalKind,
  reference: string, now: Date):{ok:true; claim:Ql279ArrivalClaim}|{ok:false;reason:string} {
  const row=QL279_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row) return {ok:false,reason:'Select one of the six registered source applications.'};
  if(!['SOURCE_PUBLICATION_NOTICE','CUSTODIAN_ORIGINAL_RETURN_NOTICE','WITNESS_ORIGINAL_RETURN_NOTICE'].includes(kind))
    return {ok:false,reason:'Choose a known original artifact arrival notice type.'};
  const problem=referenceProblem(reference); if(problem) return {ok:false,reason:problem};
  if(!validClock(now)) return {ok:false,reason:'A valid local preparation time is required.'};
  return {ok:true,claim:{source,sha:row.sha,kind,referenceClaim:reference.trim(),
    preparedAt:now.toISOString(),notice:'CLAIMED_NOT_CONFIRMED',originalVerified:false,
    evidence:'PUBLIC_PROOF_404_CUSTODY_UNVERIFIED',state:'DRAFT_NOT_SENT'}};
}

export type Ql279EscalationReason='PROOF_STILL_404'|'ORIGINAL_CUSTODY_UNVERIFIED'|'REVIEWER_DISPOSITION_PENDING';
export type Ql279EscalationDraft={source:Ql270SourceId;currentSha:string;previousSha:string;
  reason:Ql279EscalationReason;priority:ReturnType<typeof ql279SourceWatch>['escalation'];
  addressedTo:'SOURCE_MAINTAINER_AND_INDEPENDENT_CUSTODIAN';preparedAt:string;
  state:'DRAFT_NOT_SENT';delivered:false;approval:'NOT_GIVEN'};

export function ql279PrepareEscalation(source:Ql270SourceId, reason:Ql279EscalationReason, now:Date):Ql279EscalationDraft {
  if(!validClock(now)) throw Error('INVALID_ESCALATION_TIME');
  if(!['PROOF_STILL_404','ORIGINAL_CUSTODY_UNVERIFIED','REVIEWER_DISPOSITION_PENDING'].includes(reason))
    throw Error('INVALID_ESCALATION_REASON');
  const row=ql279SourceWatch(now).rows.find(item=>item.source===source);
  if(!row||!row.previousSha) throw Error('UNKNOWN_ESCALATION_SOURCE');
  return {source,currentSha:row.sha,previousSha:row.previousSha,reason,priority:row.escalation,
    addressedTo:'SOURCE_MAINTAINER_AND_INDEPENDENT_CUSTODIAN',preparedAt:now.toISOString(),
    state:'DRAFT_NOT_SENT',delivered:false,approval:'NOT_GIVEN'};
}

export function ql279AuditPacket(reviewer:readonly Ql279ReviewerDraft[], arrivals:readonly Ql279ArrivalClaim[],
  escalations:readonly Ql279EscalationDraft[], asOf:Date|string) {
  const report=ql279SourceWatch(asOf);
  return [
    'QL-279 | INDEPENDENT REVIEWER DRAFTS / ORIGINAL ARRIVAL WATCH / SIX-APP ESCALATION | HELD',
    `Public source recheck ${QL279_OBSERVED_AT} | ${report.freshness} | ${report.changed} changed / ${report.unchanged} unchanged | ${report.missing}/6 original Proof-B HTTP 404`,
    `Follow-up from QL-277 ${QL277_OBSERVED_AT}: ${report.escalation} | next public recheck ${report.nextPublicCheckDueAt}`,
    ...report.rows.map(row=>`${row.repo}: ${row.previousSha} -> ${row.sha} / HTTP ${row.http} / ${row.proof} / ${row.custody}`),
    ...reviewer.map(row=>`Reviewer case ${row.checkId}: ${row.reviewerReferenceClaim} / ${row.decision} / ${row.preparedAt} / UNAUTHENTICATED / OPEN / DRAFT_NOT_SENT`),
    ...arrivals.map(row=>`Artifact arrival claim ${row.source}: ${row.kind} / ${row.referenceClaim} / ${row.sha} / CLAIMED_NOT_CONFIRMED / DRAFT_NOT_SENT`),
    ...escalations.map(row=>`Escalation ${row.source}: ${row.reason} / ${row.priority} / ${row.preparedAt} / DRAFT_NOT_SENT`),
    `Original verification preconditions: 0/${QL278_CUSTODY_PRECONDITIONS.length} | independent acceptance: 0 | originals verified: 0/6`,
    'Reviewer authentication: NOT PERFORMED | owner accessibility acceptance: NOT RECORDED | original custodian/witness: NOT VERIFIED',
    'TEST owner authorization: NOT GIVEN | authenticated GET: NOT RUN | notices actually sent: 0 | DISCONNECTED / HOLD',
    'Copy-only local draft. Not a signed reviewer decision, original arrival receipt, delivery acknowledgement or approval.'
  ].join('\n');
}
