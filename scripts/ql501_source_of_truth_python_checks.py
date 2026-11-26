#!/usr/bin/env python3
"""QL-501 cross-language, offline Source-of-Truth acceptance smoke checks.
Tests actual repository JavaScript cryptographic verifier and original CLI.
No browser, customer account, external provider or network is contacted.
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = "runtimes/master-discovery/ql501-original-host-cli.mjs"


def node(*args):
    return subprocess.run(
        ["node", *args], cwd=ROOT, text=True, capture_output=True, timeout=20,
        check=False
    )


class Ql501OfflineIntegration(unittest.TestCase):
    def test_no_send_status(self):
        result = node(CLI, "--status")
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        self.assertEqual(data["state"], "QL501_SUPERVISED_SIGNED_TRIAL_NOT_RUN")
        for field in ("automaticNetworkSend", "customerWrites",
                      "productionReleaseAuthorized", "humanAcknowledged"):
            self.assertIs(data[field], False, field)

    def test_nonoriginal_host_refuses_supervised_network(self):
        result = node(CLI, "--supervised-trial")
        # Runs only in CI: the original Windows owner can opt in separately.
        self.assertNotEqual(result.returncode, 0)
        denied = json.loads(result.stderr)
        self.assertEqual(denied["state"], "HOLD")
        self.assertFalse(denied["productionReleaseAuthorized"])

    def test_signed_trial_version_tenant_and_approval_gates(self):
        script = r"""
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from './runtimes/master-discovery/manifest.mjs';
import {QL501_SOURCE_SCHEMA,verifyQl501SourcePacket}
 from './runtimes/master-discovery/ql501-source-signed-delivery-trial.mjs';
const now=Date.now(),scope='a'.repeat(64);
const keys=generateKeyPairSync('ed25519');
const pem=keys.publicKey.export({type:'spki',format:'pem'});
const p={schema:QL501_SOURCE_SCHEMA,trialId:'trial_py_ql501_001',
 sourceId:'icamp',sourceEventId:'event_501_python_01',
 tenantScopeDigest:scope,eventDigest:'b'.repeat(64),eventVersion:2,
 purpose:'COMMS_DELIVERY_RECEIPT_RECONCILIATION',
 issuedAtMs:now-400,expiresAtMs:now+45000,
 requestedAction:'ONE_METADATA_ONLY_SOURCE_SIGNED_TRIAL_HOLD',
 customerDataIncluded:false,authorityTransfer:false};
function packet(payload){
 return {payload,signature:sign(null,Buffer.from(canonicalize(payload)),
  keys.privateKey).toString('base64url')};
}
function verify(payload,tenant=scope){
 return verifyQl501SourcePacket({sourcePacket:packet(payload),
  sourcePublicKeyPem:pem,approvedSourceId:'icamp',
  approvedTenantScopeDigest:tenant,now}).state;
}
console.log(JSON.stringify({accepted:verify(p),
 tenantCrossed:verify(p,'c'.repeat(64)),
 obsoleteVersion:verify({...p,eventVersion:0}),
 expired:verify({...p,expiresAtMs:now-1}),
 customerPayload:verify({...p,customerDataIncluded:true})}));
"""
        result = node("--input-type=module", "-e", script)
        self.assertEqual(result.returncode, 0, result.stderr)
        out = json.loads(result.stdout)
        self.assertEqual(out["accepted"],
                         "QL501_SOURCE_SIGNED_METADATA_TRIAL_REVIEW_HELD")
        for key in ("tenantCrossed", "obsoleteVersion", "expired", "customerPayload"):
            self.assertEqual(out[key], "HOLD", key)


if __name__ == "__main__":
    unittest.main(verbosity=2)
