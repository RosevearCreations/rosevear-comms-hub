# QL-365D — Cross-Device Owner Review and First Private TEST Readiness

## Outcome and hard authorization boundary

QL-365D adds an **offline one-source review proposal**, signed independently
by Ree's original source key and Jack's original master key. It binds a fresh
QL-365A/B signature chain, the exact QL-365C custody evidence hash, the exact
one of six source IDs, its platform/business shell boundary, a one-use-looking
UUID, `TEST`, `GET /api/integration/v1/shell/health` and a **90-second expiry**.
Each original Windows computer checks its own original public-key bytes before
signing, and the signatures are cryptographically verified separately.

**This is a manual owner review, NOT permission to issue that GET.** In
particular, a hash of submitted QL-365C evidence is not independent proof of
its custodian. `assessQl365dOwnerGovernedFirstTestReview` independently calls
the existing QL-365C private original-readback checks and QL-363 private
source-contract verification and can at most return a manual review candidate.
It cannot create a QL-355 original issuer, external field witness, QL-354
enrollment, QL-362 one-use claim, receiver or signed original TEST receipt.
There is no network request, database write, new key, listener or source GET
in QL-365D. All six sources remain `DISCONNECTED / HOLD` until original
authority is genuinely verified.

## Original-device operator steps — use only fresh actual evidence

1. **Both computers:** Agree on a 20-minute live review window, and choose
   **one** source ID: `yw`, `icamp`, `rosiedazzlers`, `devilndove`,
   `ai-data-platform` or `rosevear-ai-hub`. Ree operates original
   `DESKTOP-AE894KC` as Windows account `ree`; Jack operates original
   `TEMPLAR` as Windows account `jfros`. Do not run signing on CI, another
   laptop or a copied profile. Before updating either worktree, check for
   uncommitted changes; do not overwrite them.

   ```powershell
   git status -sb
   git fetch origin
   git pull --ff-only origin main
   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --status
   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --help
   ```

   `--status` must identify `source` on Ree, `master` on Jack, with no receiver
   or source GET enabled. A dirty worktree or failing original-host
   recognition is a stop condition, not a reason to alter host checks.

2. **Obtain genuine inputs:** Recreate QL-365A/B with newly signed separate
   original-owner evidence if expired. Have the independent reviewer custodian
   complete QL-365C's *actual* separately authenticated reviewer enrollment,
   separately signed decision custody and archived-byte readback. Collect
   local **public** JSON file paths for the candidate (`candidate.json`),
   Ree review (`ree-review.json`), Jack review (`jack-review.json`) and signed
   custody (`custody.json`) on each machine. Names here are placeholders;
   **never** copy encrypted private keys or passwords between machines.
   If QL-365C cannot prove independent reviewer identity and custody, STOP
   at HOLD; a self-created test JSON will not satisfy the private verifier.

3. **Ree prepares** a one-source proposal while her receiver is actually OFF.
   Enter real local paths and a brand-new output filename under
   `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Enrollment`:

   ```powershell
   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --prepare `
     yw $candidate $reeReview $jackReview $custody $newRequest
   ```

   Replace `yw` with the single source both owners chose. Define the five
   PowerShell variables above as real local paths first; `$newRequest` must
   be a new filename. Ree types the exact interactive phrase shown. The
   program stores a **public review request only** (no bearer credential).
   Both owners must use exactly matching public evidence and act before the
   proposal's 90-second expiry. For a timeout, prepare a new request;
   **never** edit timestamps, signed bytes or old files.

4. **Each owner inspects then signs** the exact digest on their own original
   computer; securely transfer only public evidence/request and approval
   JSON, without private keys. On each machine:

   ```powershell
   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --inspect `
     $request $candidate $reeReview $jackReview $custody

   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --sign `
     $request $candidate $reeReview $jackReview $custody `
     $reviewedSha256 $newApproval
   ```

   Set `$reviewedSha256` to the **exact** `requestSha256` independently
   read back on both machines, not one merely reported by the other owner.
   `$newApproval` must be a new file in that computer's private `Enrollment`
   directory. Each owner types their own displayed phrase and enters the
   original encrypted-key passphrase privately; nothing is posted to GitHub
   or ChatGPT. A changed digest or expired proposal fails closed.

5. **Ree reconciles both public signatures** and separately inspects the
   resulting file. Use the exact same five public input files on Ree:

   ```powershell
   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --assemble `
     $request $candidate $reeReview $jackReview $custody `
     $reeApproval $jackApproval $newSignedReview

   node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --inspect-signed `
     $newSignedReview $candidate $reeReview $jackReview $custody
   ```

   A successful result can say
   `TWO_ORIGINAL_OWNERS_SIGNED_ONE_SOURCE_REVIEW_NO_TEST_PERMISSION`.
   It **cannot** say a source GET occurred or the six apps connected.

6. **Separately appointed original private operator:** Check genuine,
   independently obtained QL-365C identity/custody, original receiver OFF,
   PostgreSQL `NOLOGIN`/no enrollment, both owner sessions and six still-HELD
   peers, plus a separately pinned QL-363 source-owned contract. Then require
   the existing QL-355 issuer/field witness and QL-354 enrollment, plus
   QL-362 one-use authorization and archived signed original GET receipt.
   This QL-365D CLI provides **no** `--authorize`, `--activate` or `--test`
   command. Do not invent one. A real one-source TEST is a separate supervised
   action under the legacy protected operator, never an automated step.

## Verification and handoff to all six apps

Run:

```bash
node --test runtimes/hub-relay/ql365d-first-test-ceremony.test.mjs
node runtimes/hub-relay/ql365d-original-test-cli.mjs --status
```

CI uses synthetic keys and must prove production pins reject them, cross-role
or changed signatures fail, source boundaries are not interchangeable,
expired/replayed scope fails, and neither synthetic custody nor original
owner signatures create an actual private TEST. Windows CI cannot impersonate
Ree or Jack to prepare/sign/enroll.

**Share this separate source-specific instruction document with each app's
developer/operator:**
[Six-app attachment and validation handoff](../handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).
Each source must return its own exact manifest, handler and contract readback,
immutable protected revision, separately authenticated source signer, original
trust gaps and honest `DISCONNECTED / HOLD` status. Never batch six GETs or
expose customer data, billing, door locks, cameras or device operations.

Sources: [QL-365D signed-review gate](../../runtimes/hub-relay/ql365d-first-test-ceremony.mjs),
[original-device CLI](../../runtimes/hub-relay/ql365d-original-test-cli.mjs),
[QL-365C independent custody verifier](../../runtimes/hub-relay/ql365c-reviewer-custody.mjs),
[QL-363 source health contract](../../runtimes/hub-relay/ql363-six-source-health-adapters.mjs),
[QL-362 one-use GET gate](../../runtimes/hub-relay/ql362-source-owner-first-get.mjs).
