#!/usr/bin/env python3
"""QL503 source-of-truth safety checks. CI is offline; connected live SQL RLS
test is separate and rollback-only. No provider credentials or customer data.
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261127124701_ql503_authenticated_scoped_delivery_ledger.sql"


def js(script):
    return subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT, capture_output=True, text=True, timeout=20,
        check=False,
    )


class QL503OfflineSecurity(unittest.TestCase):
    def test_exact_schema_append_only_rls_and_private_rpc(self):
        sql = MIGRATION.read_text(encoding="utf-8")
        for name in ("tenant_read_grants", "delivery_messages", "delivery_evidence"):
            self.assertIn(
                f"ALTER TABLE public.ql503_{name} FORCE ROW LEVEL SECURITY",
                sql,
            )
        self.assertIn("REVOKE ALL ON public.ql503_tenant_read_grants", sql)
        self.assertIn("TO service_role;", sql)
        self.assertIn("SECURITY INVOKER", sql)
        self.assertNotIn("TO anon;\nGRANT", sql)
        self.assertIn("QL503_DELIVERED_CLAIM_REQUIRES_PRIOR_ACCEPTED_RECEIPT", sql)
        self.assertIn("QL503_APPEND_ONLY_EVIDENCE_REQUIRES_NEW_SIGNED_RECORD", sql)

    def test_signed_import_must_be_approved_and_existing_receipt_alone_cannot_send(self):
        src = """
import {buildQl503VerifiedImport} from './runtimes/master-discovery/ql503-durable-verified-import.mjs';
const a=buildQl503VerifiedImport({});
const b=buildQl503VerifiedImport({serverConfig:{
 approvedBrand:'icamp',approvedTenantDigest:'a'.repeat(64),
 sourcePublicKeyPem:'not-a-key',providerPublicKeyPem:'not-a-key',
 currentVersion:2,importEnabled:true}});
console.log(JSON.stringify({empty:a.state,
 forged:b.state,customerMessageSent:a.customerMessageSent??false,
 noDurableWrite:a.durableWrite}));
"""
        result = js(src)
        self.assertEqual(result.returncode, 0, result.stderr)
        out = json.loads(result.stdout)
        self.assertEqual(out["empty"], "HOLD")
        self.assertEqual(out["forged"], "HOLD")
        self.assertFalse(out["customerMessageSent"])
        self.assertFalse(out["noDurableWrite"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
