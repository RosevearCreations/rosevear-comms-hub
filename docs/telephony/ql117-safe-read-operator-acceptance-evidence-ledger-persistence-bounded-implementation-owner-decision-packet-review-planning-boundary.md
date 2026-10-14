# QL-117 telephony boundary

QL-117 never enables voice, IVR, DTMF, inbound/outbound Phone/SMS, provider tokens/calls, callbacks, recordings, consent records, archives, audit, retention, AI sending or live pilots. Packet review planning is display text only and does not process actual telecom payloads.

All future runtime activation requires an explicitly owner-approved, separately reviewed implementation build and passing exact production checks. Any newly introduced send/receive/callback/consent/retention write path is a STOP.
