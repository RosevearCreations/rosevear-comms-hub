# QL-376 — Unmerged Branch Custody Review (8 November 2026)

The 355 references already verified ancestry-merged into both `dev` and `main` were deleted in the preceding cleanup. This follow-up reviews the other 91 references existing before QL-376.

## Evidence and decision

- **59 references** have no patch-unique commits relative to `main` (`git cherry`), and are eligible for branch-reference cleanup after production verification.
- **32 references** retain patch-unique commits; their **24 distinct patch-unique commits** include original-owner signer custody, MFA recovery, Windows original-device safeguards and private receiver work. Preserve those references until the code and audit history are deliberately reconciled. Git patch identity alone cannot prove this work is safely disposable.
- No open GitHub pull requests were returned at the time of review.
- Across all 91 branch tips, no changed file was absent from `main`, and no migration SQL blob differed from its same-path file on `main`. These two checks reduce risk but do not substitute for semantic review of unique patches.
- Neither deletion of a branch name nor a previous production GREEN is an owner signature, receiver enrollment or source activation.

## 32 preserved references and their exact heads

| Branch | Head SHA | Patch-unique commits vs `main` |
|---|---|---:|
| `codex/ql270-workers-production-trigger` | `5bd16eb08d999ee32286c47e4f1bb621e27e1c9b` | 1 |
| `codex/ql339b-receiver-20261105` | `351a229c93667e86ae6181615eaf9fcb3f2026c0` | 2 |
| `codex/ql340-owner-authority-custody-20261105` | `ec27c238460c8b226fc56385b9330e205c8a2c80` | 2 |
| `codex/ql340b-offline-enrollment-20261105` | `ed37f4d6e0df8621d82cd2d05c38e08ee223d728` | 2 |
| `codex/ql346-issuer-trust-20261106` | `e274b7c37862409f3a41d03e77809ea33c4bac09` | 2 |
| `codex/ql347-main-20261106` | `ed475d77e2531cb78bef4c7b57195a46e6ca462b` | 1 |
| `codex/ql361-original-archive-audit-dev` | `8737f126a5f16e40be37cb073e76c2a41631c172` | 2 |
| `codex/ql362-source-owner-get-dev` | `78351d03f6446412358e2454ae6ed1fdceda1182` | 2 |
| `codex/ql363-source-health-dev` | `20dd97b0917d84d07443297eedb1e76efb162602` | 2 |
| `codex/ql364-source-health-dev` | `e66526fac2f6b1a66eba08090d598cd174541bba` | 2 |
| `codex/ql365a-owner-bootstrap` | `fcfbba5f75c26d873fe103d25e7694c61e82aa33` | 2 |
| `codex/ql365b-original-reconciliation-dev` | `6863ba4805efbf2bbe45e468b1e0fd16a9a9989b` | 2 |
| `codex/ql365c-independent-reviewer-dev` | `bf66ec0d8819967f27e281f2e40e77ca5058530d` | 2 |
| `codex/ql365d-original-test-ceremony-dev` | `5e33409d7491dc3080e1dce98d02fe1e3254c1a7` | 2 |
| `codex/ql365d-preserve-prior-field-validation-dev` | `58bddf3bc7b134758bedae00d017e935ab40459c` | 2 |
| `codex/ql366-rosevear-dual-owner-policy` | `d32216be43f7811cbbdcf35170f1dacde8c4dc4c` | 4 |
| `codex/ql367-owner-auth-dev-isolated-20261108` | `9eb9c208eef583e3df102e6648c97cc60fc6ee5e` | 5 |
| `codex/ql368-dual-owner-dev` | `3c1606fdfd973ba0cda4e779da95fc4aee8d54b1` | 7 |
| `codex/ql368-dual-owner-main` | `c3a0778f9f8de6e7a3a8209dd65353fbd3688363` | 2 |
| `codex/ql369-authenticated-enrollment` | `77828a912b0290b300394b12710d88a4fe636683` | 5 |
| `codex/ql370-owner-progress` | `5249f01bfc03a102263e96bd1e2f1c6ac447cbb6` | 5 |
| `codex/ql371-original-owner-dev` | `87d53fe3ce9198485e77c2a5c2d2f855b9b3c2c5` | 5 |
| `codex/ql372-supervised-owner-dev` | `b1e653123066b96d68550579887ae8e486a61ad4` | 5 |
| `codex/ql373-owner-readiness-dev` | `9a9e6b41d2fa4a6e31c108ed9d0a33fe37ce7ebf` | 5 |
| `codex/ql374-owner-shell-dev` | `cf56e46aba3549f22bbefe9bfcacfc2ebff0f38c` | 5 |
| `codex/ql375-owner-six-app-status-dev` | `55af0e4d1074260019f17d23648b313f9935cb37` | 6 |
| `feature/ql342-dev` | `ff3aef31e3bffcde58a2425f4f2055aafe822b63` | 2 |
| `feature/ql357-original-enrollment-private-receiver` | `cc6b940cd7429383cf31def524916ad28109256f` | 2 |
| `feature/ql358-original-authority-credential-live-test` | `ac92d6e364e723d8452e8e9e74483a9c3b162004` | 2 |
| `feature/ql359-original-authority-supervised-private-test` | `0ec095fb41947ddd78afe1a9e9d101277bd669c9` | 2 |
| `feature/ql360-original-private-evidence-archive` | `1bbec526e1a7ab182f3c159b6cd09b2b87a13f07` | 2 |
| `release/ql342-main` | `42f62225caf440d770894588abb38b409b8ad535` | 2 |

These references are protected for reconciliation; the SHAs are an index, not an independent archival guarantee if their references are later deleted.
