# QL-187 — Provider Decision & Cost Model

**State:** A **synthetic, unpriced vendor-decision framework**, published only through the disabled GitHub Pages preview. It is not a price quote, provider selection, order, account creation, Bell forwarding instruction, number-port request, consent grant or live-pilot approval. QL-181's **12 prerequisites stay `HELD_UNVERIFIED`**. Exact-main build/Pages verification is recorded separately after release.

## Operator preview

Open **Operator workspace → Phone/SMS safety → QL-187 Provider decision & cost model**. Business context is Rosie Dazzlers or Devil n Dove. The operator can change imaginary monthly traffic, display currency, a **hypothetical** CAD/USD conversion, a fictional USD budget and an illustrative contingency reserve. The component has no free-text contact fields, payment UI, provider keys, local persistence or network code. Brand switching remounts the calculation and rejects any cross-brand request.

The displayed currency is **not a live foreign-exchange rate**. Currency conversion and reserves are for sensitivity demonstration only. All embedded unit rates differ by candidate but are explicitly **invented**; they do not represent observed current rates. They must not be copied into an actual budget authorization or treated as a provider ranking. Real costs, accessibility, service limitations and terms require fresh itemized quotes.

## Line ownership and sequencing

| Line / route | Known starting position | QL-187 decision |
| --- | --- | --- |
| Bell Fibe home phone | Existing home line; features and fees depend on the subscribed plan | **Preserve**, no forwarding or porting. Confirm ownership, forwarding and charges with Bell separately if contemplated. |
| Rosie Dazzlers business mobile | Separately owned business-use cellular number | **Preserve**, no porting, SIM/SMS access or forwarding. |
| Devil n Dove business mobile | Separately owned business-use cellular number | **Preserve**, no porting, SIM/SMS access or forwarding. |
| Laurie's personal/business mobile | Mixed personal and business use | **Exclude** from shared routing and any automated communications absent distinct privacy/owner review. |
| New dedicated test number | Not purchased; owner previously wanted a small low-cost test before changing existing lines | **Only proposed future pilot option**; quote and separately authorize *before* ordering. |

## Candidate shortlist — no selection

| Candidate | Official primary source | Confirm before purchase |
| --- | --- | --- |
| VoIP.ms | [Pricing](https://voip.ms/pricing) and [service-cost explanations](https://wiki.voip.ms/article/Service_Cost) | Canada DID availability; inbound/outbound routing; SMS/MMS availability and registration; API behaviour; voice quality; support; recording and emergency-call terms. |
| Telnyx | [Pricing](https://telnyx.com/pricing) and [Canadian SMS-number considerations](https://support.telnyx.com/en/articles/7183887-sms-for-ported-in-phone-numbers) | Canadian number type, messaging profile, per-direction charges, carrier pass-through, valid webhook signatures, tax and currency. |
| Twilio | [Canada SMS pricing](https://www.twilio.com/en-us/sms/pricing/ca) and [Canada voice pricing](https://www.twilio.com/en-us/voice/pricing/ca) | Number rental, in/out voice, SMS segment counts, carrier surcharges, MMS, webhook/authentication, eligibility and registration. |
| Existing Bell/cell plans | [Bell home forwarding guidance](https://support.bell.ca/home_phone/calling_features/how_to_use_call_forwarding_on_my_bell_home_phone) | **Not modeled as free or programmable**; retain present charges in household/business bills and validate any future forwarding terms. |

**Decision posture:** All three technical candidates remain **UNVERIFIED / NOT SELECTED**. Review APIs, privacy/data residency, Canadian support, CAD billing, local area codes, SMS limits, number portability, E911, provider-level recording requirements and exit costs. Free GitHub Pages cannot safely terminate live provider webhooks or store provider secrets; a separate protected server design is prerequisite. QL-188 is only a synthetic auth/replay harness proposal, not a live endpoint.

## Transparent hypothetical arithmetic

The checked-in `QL187_DEMO_RATES` are purely instructional numbers in **USD**; they are **not vendor prices**, historical snapshots or quotations. Monthly scenario volumes are explicitly fabricated:

| Demo volume | Voice incoming/outgoing minutes | SMS incoming/outgoing segments | Outgoing MMS |
| --- | ---: | ---: | ---: |
| Small | 60 / 25 | 30 / 45 | 4 |
| Regular | 300 / 150 | 190 / 260 | 20 |
| Busy | 1,200 / 700 | 750 / 1,150 | 90 |

`recurring USD = number monthly + platform monthly + other monthly + incoming voice minutes × inbound minute rate + outgoing voice minutes × outbound minute rate + incoming SMS segments × inbound segment rate + outgoing SMS segments × outbound segment rate + outgoing MMS × MMS rate`

`planning total USD = recurring USD × (1 + reserve% / 100)`; if CAD is selected, multiply by the entered fictional CAD-per-USD factor. Only the USD planning total is compared with the fictional USD owner-budget threshold. Rounded two-decimal display values are estimates, not billing precision. Real providers may have tier thresholds, per-call rounding, short/long SMS segmenting, onboarding costs, verification and 911 fees, taxes, carrier/registration pass-through, credits and monthly minimums. Actual exchange rates can vary and create significant additional risk. **All those missing components must be explicitly itemized before any real budget decision.**

### Real provider quotation worksheet (outside preview)

For each provider request written confirmation of:

1. Exact Canadian area code and local number availability, monthly rental, voice routing, inbound/outbound rates and minute rounding.
2. SMS/MMS eligibility and message/segment volume, registration, campaigns, verification, surcharges and STOP/HELP control limitations.
3. Software platform/API, webhook authentication, support/service uptime, logging, privacy/data residency and retention terms.
4. One-time activation, E911, tax, exchange conversion, prepaid balance, refunds, minimum usage and cancellation/port-out fees.
5. Business-specific cost estimate for *one new number* at low, regular and busy volumes; written owner spending ceiling and a hard stop/rollback plan.

The **only candidate ranking** permitted after this comparison is a separate owner-reviewed record using real quotes and evidence; no UI event in QL-187 yields a winner. Any subsequent purchase must be a new independently authorized task, not an interpretation of a simulated `withinIllustrativeBudget` flag.

## Safety invariants and acceptance

- `evaluateQl187Costs` is a pure function with an exact request-field allowlist. Invalid, cross-brand or forged requests return no cost rows. Changing a selector never creates vendor accounts or changes existing lines.
- `vendorPricesVerified=false`, `providerSelected=false`, `providerConnected=false`, `numberPurchased=false`, `forwardingChanged=false`, `portingChanged=false`, `pilotAuthorized=false` and all network/storage/approval counters remain zero for **every** input.
- All 12 independent QL-181 live-pilot prerequisites remain held. QL-185 retention and QL-186 consent decisions are still blueprints; no customer information, credentials, Supabase schema/writes, phone routing, live provider integrations or consent activity are enabled.
- Regression tests check all three volume tiers, both businesses and currencies, correct line-item arithmetic, reserves, FX and budget comparisons, malformed/forged payload rejection, cross-brand privacy, no local storage/network, keyboard/mobile presentation and shell integration.
- Before promotion: `npm run check`, `npm test`, `npm run build`, `npm run pages:build` inside `app`; QL-171 baseline and tests; QL-170 receipt tests; `git diff --check`. Feature PR to `dev`, promotion PR `dev` to `main`, five exact-main checks, and live GitHub Pages asset containing `ql187-provider-decision-cost-model-v1` must pass before calling the disabled-preview release GREEN.

## Remaining proposed roadmap

After QL-187 GREEN, **three proposed builds remain**: QL-188 — Server Auth, Webhook & Replay Test Harness; QL-189 — Operations Safety Controls; QL-190 — Independent Pre-Pilot Review Packet. The independent owner/security/legal/provider decisions and 12 real-pilot holds are **additional**, not automatically closed by these numbered builds.
