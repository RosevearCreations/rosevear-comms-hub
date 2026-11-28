# QL-507 — Original Windows Field Witness and Provider-Signed Pilot Preparation

**28 November 2026 · Comms-only · QL-506 code production baseline.**

## Delivered in code

1. A **fifth independent Ed25519 observer key** can sign a tightly scoped, short-lived on-device observation *claim*. Service key, source, provider, prior reviewer, and observer must be all distinct. Reused or forged signers fail closed.
2. QL-506 service-identity signature and its original source+tenant, bundle SHA, private journal SHA and target project are checked again; no trust-on-first-use key enrollment.
3. QL-502's signed *current-version* original intent and independently signed **PROVIDER_ACCEPTED** receipt must match the original source and tenant. A provider-DELIVERED packet or outdated-version intent does not turn into a pilot authorization.
4. The original Windows witness claim binds the exact source, provider and service-identity packet SHA-256 digests, observer identity, device label, manual-not-started mode, OFF receiver and no-send status. Signed claims, including on-device labels, **do not physically attest hardware or a running service**. The code reports preparatory proof review only.
5. \`ql507-original-host-cli.mjs --status\` works offline anywhere. \`--inspect\` is permitted only on the original **DESKTOP-AE894KC** under the Ree Windows user, and only reads counts from the existing private QL504 metadata journal. All action flags return HOLD; no credential read, listener, sends, service changes or QL340C receiver startup.
6. New Linux and Windows Node negative tests verify forged/stale/altered source, provider, observer, tenant, version and original-host claims; no new public React endpoints or Supabase migration.

## Field gate boundary

**Code Production GREEN** is a successful protected `dev` and exact `main` release with Linux, Windows and Worker asset parity passing.

**Field is still HOLD:** A test-only signed fixture is not a real independent physical witness, operational service identity, real provider delivery, or customer acknowledgement. The separate approved private original-host operator must record physical device/host/service observations, privately custody service-role credentials, independently confirm a provider-side receipt, and gain explicit owner authorization for any controlled one-time pilot. QL340C remains OFF until separately authorized. Do not ask other app owners to pause their builds or enter customer/financial data.

**No owner steps needed for QL-507 code GREEN.** Previous Windows stage 1–2 inventory does not need to be repeated.

## Optional, safe local read-only check

Only if the owner separately wants to view the current original-machine journal counts, on **DESKTOP-AE894KC** under Ree in PowerShell:

```powershell
Set-Location C:\rc470
git fetch origin main
git switch main
git pull --ff-only origin main
node .\runtimes\master-discovery\ql507-original-host-cli.mjs --status
node .\runtimes\master-discovery\ql507-original-host-cli.mjs --inspect
```

No credentials, signing keys or customer messages should be pasted into chat, GitHub or public logs.

## Next verified field gap

Complete the **independent on-device service identity and true provider-side readback** under a separately supervised ceremony. Plan next code build only after observing the current Comms-specific failures. Do not label a numerical queue complete without a maintained roadmap.
