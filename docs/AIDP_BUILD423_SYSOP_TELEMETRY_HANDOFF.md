# AIDP Build 423 — Comms Hub Sysop telemetry source handoff

Comms Hub provides a loopback-only source server for `GET /internal/rosevear/sysop/telemetry/v1`. It is deliberately separate from public Cloudflare assets and from the QL-340C communication receiver.

Launch is explicit with `node runtimes/hub-relay/sysop-telemetry423-server.mjs --serve` after server-side read-token, Ed25519 signer and exact source-commit enrollment. Default loopback port is 8790 and may be changed with `ROSEVEAR_SYSOP_TELEMETRY_PORT`.

The feed contains non-sensitive aggregate statistics and process-level Sysop observations only. It never contains customer conversations, phone/SMS bodies, contacts or provider credentials and never authorizes communications. Comms cannot claim the original Windows host boot. Missing enrollment remains HOLD. Coordination issue: #967.
