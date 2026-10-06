export type PhoneSmsRollbackRetentionDecision =
  | "approve_retention_plan"
  | "revise_retention_plan"
  | "hold_retention_plan";

export type PhoneSmsRollbackRetentionClass =
  | "discard_preview"
  | "retain_redacted_planning_note"
  | "hold_pending_review";

export interface PhoneSmsRollbackRetentionSource {
  readonly sourceId: string;
  readonly sourceBuild: "QL-028" | "QL-029" | "QL-030" | "QL-031";
  readonly sourceKind:
    | "runtime_verification"
    | "evidence_mapping"
    | "human_review_decision"
    | "operator_outcome_journal";
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly containsLivePayload: false;
  readonly containsCustomerData: false;
  readonly containsActualPhoneNumber: false;
  readonly containsProviderSecret: false;
  readonly containsRecordingOrTranscript: false;
  readonly retentionClass: PhoneSmsRollbackRetentionClass;
  readonly rollbackRequired: boolean;
  readonly rollbackScope: readonly string[];
  readonly retentionReason: string;
}

export interface PhoneSmsRollbackRetentionInput {
  readonly reviewId: string;
  readonly build: "QL-032";
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly operatorAlias: string;
  readonly decision: PhoneSmsRollbackRetentionDecision;
  readonly sources: readonly PhoneSmsRollbackRetentionSource[];
  readonly retentionWindow: "discard_after_review" | "retain_until_next_gate" | "hold_until_rework";
  readonly noPersistenceWrites: boolean;
  readonly liveCustomerAccessDisabled: boolean;
  readonly providerCallbacksDisabled: boolean;
  readonly livePhoneWebhooksDisabled: boolean;
  readonly smsSendingDisabled: boolean;
  readonly callRecordingDisabled: boolean;
  readonly aiDraftsDisabled: boolean;
  readonly aiAutoSendDisabled: boolean;
}

export interface PhoneSmsRollbackRetentionEntryPreview {
  readonly entryId: string;
  readonly reviewId: string;
  readonly sourceId: string;
  readonly sourceBuild: PhoneSmsRollbackRetentionSource["sourceBuild"];
  readonly sourceKind: PhoneSmsRollbackRetentionSource["sourceKind"];
  readonly retentionClass: PhoneSmsRollbackRetentionClass;
  readonly rollbackRequired: boolean;
  readonly rollbackScope: readonly string[];
  readonly retentionReason: string;
  readonly safeToPersist: false;
  readonly futureEnablementPlanningOnly: boolean;
  readonly liveEnablementAllowed: false;
  readonly providerCallbackAllowed: false;
  readonly smsSendAllowed: false;
  readonly aiDraftAllowed: false;
  readonly autoSendAllowed: false;
  readonly persistenceWrites: false;
  readonly liveCustomerRead: false;
  readonly liveCustomerWrite: false;
}

export interface PhoneSmsRollbackRetentionReviewReport {
  readonly build: "QL-032";
  readonly title: "Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review";
  readonly status: "blocked_pending_rollback_retention_review";
  readonly reviewId: string;
  readonly decision: PhoneSmsRollbackRetentionDecision;
  readonly operatorAlias: string;
  readonly sourceBuildsReviewed: readonly string[];
  readonly sourceKindsReviewed: readonly string[];
  readonly retentionWindow: PhoneSmsRollbackRetentionInput["retentionWindow"];
  readonly entries: readonly PhoneSmsRollbackRetentionEntryPreview[];
  readonly accepted: boolean;
  readonly blockers: readonly string[];
  readonly safetyLocks: {
    readonly syntheticOnly: true;
    readonly redactedOnly: true;
    readonly safeToPersist: false;
    readonly noPersistenceWrites: true;
    readonly liveCustomerAccessDisabled: true;
    readonly providerCallbacksDisabled: true;
    readonly livePhoneWebhooksDisabled: true;
    readonly smsSendingDisabled: true;
    readonly callRecordingDisabled: true;
    readonly aiDraftsDisabled: true;
    readonly aiAutoSendDisabled: true;
  };
  readonly notIncluded: readonly string[];
  readonly nextBuild: "QL-033 — Phone/SMS Disabled Dry-Run Final Pre-Enablement Readiness Review";
}

const forbiddenEvidenceTerms = [
  "api key",
  "auth token",
  "bearer ",
  "call recording",
  "client secret",
  "customer phone",
  "customer sms",
  "invoice",
  "live payload",
  "password",
  "provider secret",
  "real operator",
  "recording url",
  "service role",
  "sip password",
  "transcript",
  "webhook secret",
] as const;

const noPhoneLikeNumber = /(?:\+?\d[\d .()\-]{6,}\d)/;

export const ql032RollbackRetentionFixtures: readonly PhoneSmsRollbackRetentionSource[] = [
  {
    sourceId: "ql032-source-runtime-disabled-response",
    sourceBuild: "QL-028",
    sourceKind: "runtime_verification",
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    containsLivePayload: false,
    containsCustomerData: false,
    containsActualPhoneNumber: false,
    containsProviderSecret: false,
    containsRecordingOrTranscript: false,
    retentionClass: "discard_preview",
    rollbackRequired: false,
    rollbackScope: ["synthetic disabled response preview only"],
    retentionReason:
      "Runtime disabled response proves the route remains blocked; keep only a redacted planning note and discard preview payloads.",
  },
  {
    sourceId: "ql032-source-mapped-preview-shape",
    sourceBuild: "QL-029",
    sourceKind: "evidence_mapping",
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    containsLivePayload: false,
    containsCustomerData: false,
    containsActualPhoneNumber: false,
    containsProviderSecret: false,
    containsRecordingOrTranscript: false,
    retentionClass: "retain_redacted_planning_note",
    rollbackRequired: true,
    rollbackScope: ["mapped contact preview", "mapped conversation preview", "mapped task preview"],
    retentionReason:
      "The shape can inform future planning, but synthetic mapped previews must be rolled back or discarded before any live enablement gate.",
  },
  {
    sourceId: "ql032-source-human-review-hold",
    sourceBuild: "QL-030",
    sourceKind: "human_review_decision",
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    containsLivePayload: false,
    containsCustomerData: false,
    containsActualPhoneNumber: false,
    containsProviderSecret: false,
    containsRecordingOrTranscript: false,
    retentionClass: "hold_pending_review",
    rollbackRequired: true,
    rollbackScope: ["human review decision preview"],
    retentionReason:
      "Held synthetic decisions must remain planning-only and be re-reviewed before any later implementation step.",
  },
  {
    sourceId: "ql032-source-operator-journal-approve",
    sourceBuild: "QL-031",
    sourceKind: "operator_outcome_journal",
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    containsLivePayload: false,
    containsCustomerData: false,
    containsActualPhoneNumber: false,
    containsProviderSecret: false,
    containsRecordingOrTranscript: false,
    retentionClass: "retain_redacted_planning_note",
    rollbackRequired: false,
    rollbackScope: ["operator outcome journal preview"],
    retentionReason:
      "Approved synthetic journal outcome can be referenced as a redacted planning note only; it does not permit persistence or live enablement.",
  },
];

export const defaultPhoneSmsRollbackRetentionInput: PhoneSmsRollbackRetentionInput = {
  reviewId: "ql032-disabled-dry-run-rollback-retention-review",
  build: "QL-032",
  syntheticOnly: true,
  redactedOnly: true,
  operatorAlias: "redacted-operator-alias",
  decision: "approve_retention_plan",
  sources: ql032RollbackRetentionFixtures,
  retentionWindow: "retain_until_next_gate",
  noPersistenceWrites: true,
  liveCustomerAccessDisabled: true,
  providerCallbacksDisabled: true,
  livePhoneWebhooksDisabled: true,
  smsSendingDisabled: true,
  callRecordingDisabled: true,
  aiDraftsDisabled: true,
  aiAutoSendDisabled: true,
};

function includesForbiddenEvidence(value: string): boolean {
  const normalized = value.toLowerCase();
  return forbiddenEvidenceTerms.some((term) => normalized.includes(term));
}

function validateSource(source: PhoneSmsRollbackRetentionSource): readonly string[] {
  const blockers: string[] = [];
  const searchable = [
    source.sourceId,
    source.retentionReason,
    ...source.rollbackScope,
  ].join(" ");

  if (!source.syntheticOnly) blockers.push(`${source.sourceId}: source must be synthetic-only.`);
  if (!source.redactedOnly) blockers.push(`${source.sourceId}: source must be redacted-only.`);
  if (source.safeToPersist !== false) blockers.push(`${source.sourceId}: source must not be marked safe to persist.`);
  if (source.containsLivePayload) blockers.push(`${source.sourceId}: live payloads are forbidden.`);
  if (source.containsCustomerData) blockers.push(`${source.sourceId}: customer data is forbidden.`);
  if (source.containsActualPhoneNumber) blockers.push(`${source.sourceId}: actual phone numbers are forbidden.`);
  if (source.containsProviderSecret) blockers.push(`${source.sourceId}: provider secrets are forbidden.`);
  if (source.containsRecordingOrTranscript) blockers.push(`${source.sourceId}: recordings and transcripts are forbidden.`);
  if (noPhoneLikeNumber.test(searchable)) blockers.push(`${source.sourceId}: phone-like number detected.`);
  if (includesForbiddenEvidence(searchable)) blockers.push(`${source.sourceId}: forbidden evidence term detected.`);

  return blockers;
}

function unique(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

export function reviewPhoneSmsDisabledDryRunRollbackEvidenceRetention(
  input: PhoneSmsRollbackRetentionInput = defaultPhoneSmsRollbackRetentionInput,
): PhoneSmsRollbackRetentionReviewReport {
  const blockers: string[] = [];

  if (input.build !== "QL-032") blockers.push("Review build must be QL-032.");
  if (!input.syntheticOnly) blockers.push("Rollback and retention review must be synthetic-only.");
  if (!input.redactedOnly) blockers.push("Rollback and retention review must be redacted-only.");
  if (input.operatorAlias.trim() === "") blockers.push("Operator alias must be a redacted alias label.");
  if (noPhoneLikeNumber.test(input.operatorAlias)) blockers.push("Operator alias must not include phone-like numbers.");
  if (includesForbiddenEvidence(input.operatorAlias)) blockers.push("Operator alias includes forbidden evidence terms.");
  if (!input.noPersistenceWrites) blockers.push("Persistence writes must remain disabled.");
  if (!input.liveCustomerAccessDisabled) blockers.push("Live customer access must remain disabled.");
  if (!input.providerCallbacksDisabled) blockers.push("Provider callbacks must remain disabled.");
  if (!input.livePhoneWebhooksDisabled) blockers.push("Live phone webhooks must remain disabled.");
  if (!input.smsSendingDisabled) blockers.push("SMS sending must remain disabled.");
  if (!input.callRecordingDisabled) blockers.push("Call recording must remain disabled.");
  if (!input.aiDraftsDisabled) blockers.push("AI drafts must remain disabled.");
  if (!input.aiAutoSendDisabled) blockers.push("AI auto-send must remain disabled.");
  if (input.sources.length === 0) blockers.push("At least one synthetic source must be reviewed.");

  for (const source of input.sources) {
    blockers.push(...validateSource(source));
  }

  const entries = input.sources.map((source, index): PhoneSmsRollbackRetentionEntryPreview => ({
    entryId: `${input.reviewId}-entry-${String(index + 1).padStart(2, "0")}`,
    reviewId: input.reviewId,
    sourceId: source.sourceId,
    sourceBuild: source.sourceBuild,
    sourceKind: source.sourceKind,
    retentionClass: source.retentionClass,
    rollbackRequired: source.rollbackRequired,
    rollbackScope: source.rollbackScope,
    retentionReason: source.retentionReason,
    safeToPersist: false,
    futureEnablementPlanningOnly: input.decision === "approve_retention_plan",
    liveEnablementAllowed: false,
    providerCallbackAllowed: false,
    smsSendAllowed: false,
    aiDraftAllowed: false,
    autoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
  }));

  return {
    build: "QL-032",
    title: "Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review",
    status: "blocked_pending_rollback_retention_review",
    reviewId: input.reviewId,
    decision: input.decision,
    operatorAlias: input.operatorAlias,
    sourceBuildsReviewed: unique(input.sources.map((source) => source.sourceBuild)),
    sourceKindsReviewed: unique(input.sources.map((source) => source.sourceKind)),
    retentionWindow: input.retentionWindow,
    entries,
    accepted: blockers.length === 0,
    blockers,
    safetyLocks: {
      syntheticOnly: true,
      redactedOnly: true,
      safeToPersist: false,
      noPersistenceWrites: true,
      liveCustomerAccessDisabled: true,
      providerCallbacksDisabled: true,
      livePhoneWebhooksDisabled: true,
      smsSendingDisabled: true,
      callRecordingDisabled: true,
      aiDraftsDisabled: true,
      aiAutoSendDisabled: true,
    },
    notIncluded: [
      "actual phone numbers",
      "real operator identities",
      "provider credentials",
      "provider webhooks",
      "webhook secret values",
      "customer data",
      "live provider payloads",
      "call recordings",
      "transcripts",
      "screenshots or invoices",
      "Supabase migrations",
      "persistence writes",
      "live phone/SMS enablement",
      "AI draft generation",
      "AI auto-send behavior",
    ],
    nextBuild: "QL-033 — Phone/SMS Disabled Dry-Run Final Pre-Enablement Readiness Review",
  };
}

export function runPhoneSmsDisabledDryRunRollbackEvidenceRetentionReview(): PhoneSmsRollbackRetentionReviewReport {
  return reviewPhoneSmsDisabledDryRunRollbackEvidenceRetention(defaultPhoneSmsRollbackRetentionInput);
}
