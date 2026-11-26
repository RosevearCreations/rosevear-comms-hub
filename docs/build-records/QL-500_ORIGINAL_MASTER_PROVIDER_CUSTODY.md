# QL-500 — Original Master Provider Configuration and Signed Receipt Custody

## Scope

QL-500 can check the original Windows owner's existing QL-499 provider
configuration without reading or printing secret key bytes. It verifies
that the exact preapproved private HTTPS endpoint, pinned public server
certificate SHA-256 and certificate/key file references exist. It cannot
discover a provider that has not yet been enrolled or verify private
Windows ACLs from another machine.

The two-sided provider/owner Ed25519 receipt custody review compares
genuine QL-497 original client and separately held Master journal
readbacks, original QL-499 path evidence, TLS certificate pin and
provider runtime metadata. Preferred review repeats the raw QL-497
through QL-499 crypto verification rather than accepting caller-invented
review flags. An explicit owner-triggered metadata-only custody journal
uses an exclusive writer lock, SHA-256 hash chain and fsync; it refuses
replays and does not grant production or delivery authority.

GitHub green confirms only the code/test release, not live provider
service availability, a physical Windows ceremony, an actual receipt
exchange or independent network-path certification. All field
certification remains HOLD until real independently inspected evidence
exists. QL-333 original source-manifest audit is a separate HOLD.

## Files

- runtimes/master-discovery/ql500-original-provider-custody.mjs
- runtimes/master-discovery/ql500-original-provider-custody.test.mjs
- runtimes/master-discovery/ql500-original-host-cli.mjs
- This runbook and additional Linux/Windows CI checks.

## Original owner PowerShell — safe status and local inventory

On DESKTOP-AE894KC as Ree:

    Set-Location C:\rc470
    git status -sb
    git status --porcelain
    git branch --show-current
    git remote -v

Do not pull into a dirty tree or the wrong repository. Do not reset,
stash, clean or overwrite owner files. With clean main and correct
RosevearCreations/rosevear-comms-hub origin only:

    git fetch origin main
    git pull --ff-only origin main
    git rev-parse HEAD
    node .\runtimes\master-discovery\ql500-original-host-cli.mjs --status
    node .\runtimes\master-discovery\ql500-original-host-cli.mjs --inventory

Status is completely inert. Inventory reads local config references
from %LOCALAPPDATA%\Rosevear\CommsHub\Private. It does not connect
to a service, read key contents or send messages. Missing real provider
config is HOLD, not an invitation to insert a fake host.

## Real supervised provider and source field prerequisites

1. Identify the independently operated actual Master service, TLS 1.3
   endpoint, enrolled original client key, CA and pinned server cert.
2. Obtain genuine QL-497 original-device witness and separate client/
   Master receipt journals plus independently signed readbacks.
3. Obtain the authentic raw QL-498 and QL-499 runtime/path witnesses,
   including actual owner-supervised TLS observation when approved.
4. Have the outside provider and original owner sign distinct QL-500
   custody packets, bound to exact trial, source, ceremony, TLS pin,
   configuration and *both* original receipt journal digests.
5. Only the explicitly authorized original-host process should invoke
   the raw-evidence custody audit/append. Journal writes store hashes
   and identifiers, not PEM keys or protected payloads.
6. A separate real client-to-Master application delivery and independent
   provider ACK test is still needed for operational acceptance.
   Do not send customer data or enable the receiver automatically.
7. Resolve QL-333 six-source manifest evidence separately.

Do not paste private keys, original signed payload packets, internal
credentials or customer data into chat, PRs or GitHub Actions.

## Release gates

Use independent five-file dev and main candidates, keeping divergent
histories separated. Dev and main candidate Linux/Windows CI must pass.
Exact merged main requires Linux QL-336A tests, Windows original-host
safety and public Worker JS/CSS SHA-256 parity.

No live Vercel deployment is implied by a GitHub-only release.

Next proposed: QL-501 — Independently Observed Original Master Receipt
Delivery Trial, Source-Signed Provider ACK and Production Hold Release
Decision Review.
