# QL-324 — Six-app connection catalogue, topology and tenant-scope blueprint

This I.T. Command screen is a **credential-free configuration blueprint**, not a functioning integration. Six registered sources derive from the QL-270 source register and QL-303 immutable public-proof history; no new endpoint discovery or private gateway request is performed.

| Source | Public repository | Future role | Customer-tenant boundary | Status |
| --- | --- | --- | --- | --- |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | Detailing intake, quote review | One independent nonproduction detailing tenant | DISCONNECTED / HOLD |
| Devil n Dove | `RosevearCreations/devilndove-site` | Maker enquiry and draft handoffs | One independent maker tenant; Etsy/shop data excluded | DISCONNECTED / HOLD |
| iCamp | `RosevearCreations/iCamp` | Campground intake and service | Each campground has a different tenant; production Camp Rosevear excluded | DISCONNECTED / HOLD |
| Yard Workers | `RosevearCreations/yw` | Contractor quotes, job questions | Each contractor separate; production Rosevear Landscaping excluded | DISCONNECTED / HOLD |
| AI Data Platform | `RosevearCreations/ai-data-platform` | Optional separately permitted reporting | Shared supporting service, **not** a fifth customer tenant | DISCONNECTED / HOLD |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | Optional future private relay | Local supporting service, **not** a sixth tenant; relay OFF | DISCONNECTED / HOLD |

The source repository mapping is public metadata; the UI intentionally labels deployment mappings **NOT VERIFIED**. Planned `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities` are descriptive contract labels, not requests. Diagram and table render the same role-filtered source model. Company selection only shows public labels, static benefits and fictional nonproduction aliases; it cannot access another business's data. Any synthetic alias preview is **NOT AUTHORIZED** even if it matches a fixture. Cross-business aliases, production aliases and support-as-customer aliases are denied locally.

Five gates per source remain absent or unauthorized: original signed Proof-B; independent origin/witness; isolated nonproduction tenant; scoped TEST-only GET identity; explicit owner TEST approval. The six QL-303 public proof observations were HTTP 404 at immutable commits on 2026-11-02 and are **historical**. Their staleness is not a live service-health claim. Zero private requests, source writes, credential reads, customer records, dispatches, ACKs or relay installs. ACK delivery evidence stays **UNDER_REVIEW / PARKED_FOR_LATER**.

The screen is in `IT Command` and offers catalogue role/search filters, accessible source selection, diagram/table parity, exact blockers, public repository links, and tenant-boundary rehearsal. Test: `npm --prefix app test -- src/operator/__tests__/ql324ConnectionCatalogue.test.tsx`; full release additionally runs all app tests, TypeScript/Vite build, QL-171 baseline and exact-main/live Worker checks.

Next authorized queued item: **QL-325 — Immutable Proof, Independent Authority & Connection Gate Readback**; new source proof and owner TEST authorization must be independently acquired, never inferred from this catalogue.
