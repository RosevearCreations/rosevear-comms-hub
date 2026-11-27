#!/usr/bin/env python3
"""QL502 Source-of-Truth acceptance, invoking the exact repo Node validator.
No real accounts, web browser, provider network or live send is used.
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run_node(script):
    return subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT, text=True, capture_output=True, timeout=20, check=False
    )


class Ql502VersionTruth(unittest.TestCase):
    def test_acceptance_requires_independently_signed_provider_evidence(self):
        script = """
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from './runtimes/master-discovery/manifest.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA,reviewQl502VersionedDelivery,reviewQl502RetryPolicy}
 from './runtimes/master-discovery/ql502-provider-delivery-proof.mjs';
const now=Date.now(),tenant='a'.repeat(64);
const a=generateKeyPairSync('ed25519'),b=generateKeyPairSync('ed25519');
const signWith=(p,k)=>({payload:p,signature:sign(null,Buffer.from(canonicalize(p)),k.privateKey).toString('base64url')});
const p={schema:QL502_SOURCE_SCHEMA,sourceEventId:'event_ql502_python',
 brand:'icamp',tenantDigest:tenant,threadDigest:'b'.repeat(64),
 messageId:'message_ql502_python',contentDigest:'c'.repeat(64),
 messageVersion:1,issuedAtMs:now-500,expiresAtMs:now+40000,
 purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
 customerDataIncluded:false,authorityTransfer:false};
const src=signWith(p,a);
const pem=k=>k.publicKey.export({type:'spki',format:'pem'});
const input={sourcePacket:src,providerPackets:[],
 sourcePublicKeyPem:pem(a),providerPublicKeyPem:pem(b),
 approvedBrand:'icamp',approvedTenantDigest:tenant,currentVersion:2,now};
const saved=reviewQl502VersionedDelivery(input);
const body={schema:QL502_PROVIDER_SCHEMA,eventId:'provider_py_ql502_001',
 brand:'icamp',tenantDigest:tenant,messageId:p.messageId,messageVersion:1,
 sourcePacketDigest:createHash('sha256').update(canonicalize(src)).digest('hex'),
 providerReceiptId:'receipt_py_ql502_001',providerActorId:'provider_py_ql502',
 stage:'PROVIDER_ACCEPTED',claimedAtMs:now-300,issuedAtMs:now-250,
 expiresAtMs:now+40000,customerDataIncluded:false,authorityTransfer:false};
const accepted=reviewQl502VersionedDelivery({...input,providerPackets:[signWith(body,b)]});
const drift=reviewQl502VersionedDelivery({...input,providerPackets:[signWith({...body,tenantDigest:'f'.repeat(64)},b)]});
const retry=reviewQl502RetryPolicy({brand:'icamp',approvedBrand:'icamp',
 tenantDigest:tenant,approvedTenantDigest:tenant,authorizedOperator:true,
 consent:'OPTED_OUT',requestedVersion:1,currentVersion:2,
 expiresAtMs:now+40000,providerHealthy:true,now});
console.log(JSON.stringify({
 saved:saved.state,savedDelivered:saved.providerDelivered,
 accepted:accepted.state,acceptedDelivered:accepted.providerDelivered,
 drift:drift.state,retry:retry.state,retryCanSend:retry.canSend,
 humanAcknowledged:accepted.customerAcknowledged
}));
"""
        output = run_node(script)
        self.assertEqual(output.returncode, 0, output.stderr)
        data = json.loads(output.stdout)
        self.assertEqual(data["saved"], "QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD")
        self.assertFalse(data["savedDelivered"])
        self.assertEqual(data["accepted"], "QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD")
        self.assertFalse(data["acceptedDelivered"])
        self.assertEqual(data["drift"], "HOLD")
        self.assertEqual(data["retry"], "HOLD")
        self.assertFalse(data["retryCanSend"])
        self.assertFalse(data["humanAcknowledged"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
