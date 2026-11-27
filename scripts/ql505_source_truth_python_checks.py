#!/usr/bin/env python3
"""QL-505 offline multi-language acceptance. No live key/tenant/receiver is used."""
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "runtimes/master-discovery/ql505-original-host-cli.mjs"
RUNTIME = ROOT / "runtimes/master-discovery/ql505-private-runtime.mjs"
DB_GATEWAY = ROOT / "runtimes/master-discovery/ql505-private-db-gateway.mjs"
MIGRATION = ROOT / "supabase/migrations/20261127182500_ql505_private_receipt_exceptions.sql"
UI = ROOT / "app/src/operator/ql505ExceptionRead.ts"


def node(*args):
    return subprocess.run(
        ["node", *args], cwd=ROOT,
        text=True, capture_output=True, timeout=20
    )


class QL505SourceTruthAcceptance(unittest.TestCase):
    def test_private_status_does_not_enroll_or_send(self):
        x=node(str(CLI),"--status")
        self.assertEqual(x.returncode,0,x.stderr)
        result=json.loads(x.stdout)
        self.assertEqual(result["build"],"QL-505")
        for key in ("receiverStarted","customerMessageSent","networkListening",
                    "physicalHostWitnessed","providerDeliveryObserved"):
            self.assertFalse(result[key],key)

    def test_nonoriginal_host_cli_refuses_runtime_activation(self):
        for arg in ("--inspect","--run-once"):
            x=node(str(CLI),arg)
            self.assertNotEqual(x.returncode,0,x.stdout)
            self.assertEqual(json.loads(x.stdout)["state"],"HOLD")

    def test_approved_comms_gateway_cannot_be_constructed_on_ci_host(self):
        js="""import {ql505CreateOriginalPrivateRpcGateway}
          from './runtimes/master-discovery/ql505-private-db-gateway.mjs';
          const q=ql505CreateOriginalPrivateRpcGateway({
            serviceKey:'sb_secret_ql505_fixture_not_a_real_key_123'});
          console.log(JSON.stringify({state:q.state,receiverStarted:q.receiverStarted}));
        """
        x=node("--input-type=module","-e",js)
        self.assertEqual(x.returncode,0,x.stderr)
        r=json.loads(x.stdout)
        self.assertEqual(r["state"],"HOLD")
        self.assertFalse(r["receiverStarted"])

    def test_schema_requires_force_rls_and_service_only_insertion(self):
        sql=MIGRATION.read_text(encoding="utf-8")
        self.assertIn("ALTER TABLE public.ql505_receipt_exceptions FORCE ROW LEVEL SECURITY",sql)
        self.assertIn("ql503_tenant_read_grants",sql)
        self.assertIn("ql505_exact_source_approved_tenant_read",sql)
        self.assertIn("SECURITY INVOKER",sql)
        self.assertIn("TO service_role",sql)
        self.assertIn("FROM PUBLIC,anon,authenticated",sql)
        self.assertIn("QL505_EXCEPTION_REPLAY_CONFLICT",sql)
        self.assertIn("ql503_reject_record_changes",sql)
        self.assertNotIn("INSERT INTO public.ql503_tenant_read_grants",sql)

    def test_client_may_only_select_and_private_runtime_never_dispatches_customer_message(self):
        browser=UI.read_text(encoding="utf-8")
        private=RUNTIME.read_text(encoding="utf-8")
        gateway=DB_GATEWAY.read_text(encoding="utf-8")
        self.assertIn("ql505_receipt_exceptions",browser)
        # Browser writes are forbidden. Node's crypto.hash.update() is NOT
        # a database mutation and must not be rejected by this static check.
        for pattern in (r"\.insert\s*\(",r"\.update\s*\(",r"\.delete\s*\("):
            self.assertNotRegex(browser,pattern)
        self.assertNotIn(".from(",private)
        self.assertNotIn("sendMail(",private)
        self.assertNotIn("sendSMS(",private)
        self.assertIn("ql505_record_receipt_exception",private)
        self.assertIn("INDEPENDENT_COMMS_FIELD_REVIEW",private)
        self.assertIn("sb_secret_",gateway)
        self.assertIn("redirect:'error'",gateway)
        self.assertIn("ql503_record_verified_delivery",gateway)

if __name__=="__main__":
    unittest.main(verbosity=2)
