# QL-079 Ops Checklist — First Safe Interaction Plan

## Verify selected interaction

- [ ] Selected first interaction is the sample brand switcher.
- [ ] Interaction is planned only for QL-080 implementation.
- [ ] Interaction uses synthetic data only.
- [ ] Interaction uses browser-local React state only.
- [ ] No Supabase client initialization is introduced.
- [ ] No provider/callback/phone runtime path is introduced.

## Verify blocked scope

- [ ] SMS sending remains disabled.
- [ ] Call runtime remains disabled.
- [ ] Recording remains disabled.
- [ ] AI send remains disabled.
- [ ] Persistence writes remain disabled.
- [ ] Live customer access remains disabled.
- [ ] Archive writes remain disabled.
- [ ] Retention writes remain disabled.
- [ ] Live pilot runtime remains disabled.

## Verify deployment after promotion

- [ ] App scaffold CI is green on main.
- [ ] GitHub Pages Disabled Preview build is green on main.
- [ ] GitHub Pages Disabled Preview deploy is green on main.
- [ ] Public URL remains `https://rosevearcreations.github.io/rosevear-comms-hub/`.
