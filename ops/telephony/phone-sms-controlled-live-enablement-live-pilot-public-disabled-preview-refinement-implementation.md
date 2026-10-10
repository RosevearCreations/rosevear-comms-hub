# QL-078 Ops Checklist — Public Disabled Preview Refinement Implementation

## Verify public preview refinements

- [ ] Floating preview shows QL-078.
- [ ] Public URL remains `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- [ ] Brand switcher separates Rosie Dazzlers and Devil n Dove.
- [ ] Queue cards show urgency, draft-only status, and locked runtime state.
- [ ] Circled-i help markers are visible.
- [ ] Timeline uses synthetic/sample data only.
- [ ] Disabled controls are labelled locked and remain inert.
- [ ] First safe interaction candidates are listed but not active.

## Verify runtime remains disabled

- [ ] No provider callbacks.
- [ ] No live phone webhooks.
- [ ] No SMS sending.
- [ ] No call runtime.
- [ ] No recording.
- [ ] No AI send.
- [ ] No persistence writes.
- [ ] No live customer access.
- [ ] No archive writes.
- [ ] No retention writes.
- [ ] No Supabase runtime change.
- [ ] No live pilot runtime.

## CI / deployment checks

- [ ] Feature PR app CI passes.
- [ ] Promotion PR app CI passes.
- [ ] Final `main` app CI passes.
- [ ] Final GitHub Pages Disabled Preview build passes.
- [ ] Final GitHub Pages Disabled Preview deploy passes.
