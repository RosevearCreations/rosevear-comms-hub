# Remote Operator — QL-024 Purchase Review Gate

Use this checklist when operating through GitHub only.

## Do

```text
1. Confirm QL-023 is GREEN on main.
2. Confirm QL-024 branch starts from dev/main parity.
3. Add purchase-review helper and fixture.
4. Add docs and operator checklists.
5. Update README, .env.example, and build sequence.
6. Open PR to dev.
7. Wait for App scaffold CI.
8. Merge to dev only after CI passes.
9. Promote the same merge commit to main.
10. Wait for main App scaffold CI to pass.
```

## Do not

```text
Do not buy a number.
Do not connect a provider account.
Do not ask for or record provider credentials.
Do not record the actual candidate or purchased phone number.
Do not commit screenshots, invoices, or ownership evidence.
Do not enable phone webhooks.
Do not enable SMS sending.
Do not enable call recording.
Do not enable AI auto-send.
Do not add a Supabase migration.
```

## GREEN signal

```text
PR CI success
main push CI success
main contains QL-024 source-of-truth docs
main contains no real provider secrets or phone-number material
```
