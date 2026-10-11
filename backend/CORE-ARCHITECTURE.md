# Flaxx Core — Garden Backend and Growth Architecture

**State:** Formation prototype; public commerce remains blocked  
**Purpose:** Give every public Garden function a governed backend home while preserving a path from the first two operators to a multi-department entity.

## One Core, separate views

Core is one governed record system with separate role views. It is not only a website administrator and it is not yet the complete Flaxx office. The Garden uses it first; later departments use the same records through narrower dashboards so there is no second truth to reconcile.

| View | What it may carry | What it must not expose or decide |
|---|---|---|
| First Operator | Product, source, cost, inventory, orders, operational work, approved prices and sale closure | Creation reinterpretation, unsupported release, or Creator-reserved matters |
| Market & Brand Operator | Content, campaigns, community, qualified demand, customer response and approved offers | Product release, price creation, private discounts, or unsupported claims |
| Product & Quality | Specifications, samples, evidence, inspection, batch and release confirmation | Commercial pressure as a reason to pass |
| Compliance | Claims, consent, contracts, stops, incidents, corrective action and audit | Turning a failed condition into permission |
| Finance | Prices, orders, payments, refunds, accounts, River and economics | Unrelated customer or marketing work |
| Customer Operations | Customer, order, shipment, case, remedy and necessary refund status | Entity-wide accounts |
| Community | Membership, community offer, participation and member payment status | Entity-wide accounts, supplier costs or unrelated customer records |
| Fulfilment | Released inventory, unit and batch identity, pack event, shipment, return and recall data | Product release authority or full finance |
| Systems | Identity, access, integrations, availability, backup, recovery and audit | Routine customer, payment or accounting contents |
| Creator | Entity-wide read access and explicitly reserved approvals | Silent amendment of Creation through software |

Permissions attach to roles and departments, not to screen appearance. Hiding a menu item is never treated as access control.

## Public Garden correspondence

| Public feature | Core records and control |
|---|---|
| Navigation and page copy | `navigation`, `pages`, `content`; draft, approval, version, expiry and withdrawal |
| Product cards and collections | `products`, `merchandisingCollections`, `productMedia`, released `skus`, active `prices` and sellable `inventory` |
| Product options | Stable entity SKU plus supplier SKU, variant attributes, colour, length, density, cap and specification links |
| Product gallery | Approved media, product/colour scope, rights, truth class and expiry |
| Verification panel | `evidence`, `claims`, `batches`, `inspections` and passing `releases`; public output contains only approved current facts |
| Find your fit | Purpose-limited `fitProfiles` and evidence-supported `fitRecommendations` |
| Search | Released catalogue and approved page/content index only |
| Favourites | Customer-scoped `favourites` |
| Bag | Customer/session-scoped `carts`; a cart never reserves unreleased inventory |
| Waitlist and Flaxx Garden | `waitlists`, consent and `communityMemberships` |
| Reviews | `reviews`, purchase-verification state, media rights, moderation and no fabricated testimony |
| Offers and the sale marker | `promotions`; proposed by Market & Brand, approved by the First Operator, bounded by recorded economics and capacity |
| Checkout | `orders`, `payments`, tax and consent records; blocked until the commerce gate passes |
| Delivery | `packEvents`, `shipments`, customer-visible status and exception handling |
| Support and returns | `cases`, `remedies`, `refunds`, incidents and learning signals |

## Product and unit traceability

Core keeps distinct identifiers for the entity SKU, supplier SKU, supplier batch, Flaxx batch, serialized unit where required, order line, pack event and shipment. A customer claim must be traceable back through that chain without relying on a person's memory.

No inventory becomes sellable because it was received. It enters quarantine and becomes sellable only through a passing release with the required evidence and independent confirmations.

## Work, follow-up and communication

- Tasks carry an owner, responsible department or role, formation stage, status, priority, dependency, due date and update history.
- Role views show only work the person owns or needs for their function.
- Channels may be departmental or explicitly cross-functional. Membership is recorded; a public or private label alone does not grant access.
- Messages do not replace decisions, approvals, release records, incidents or evidence. Material conclusions are promoted into the appropriate governed record.
- Notifications point to work; they do not become the only record of work.

This supports one operator now and many teams later because departments, appointments and access grants are records rather than hard-coded people.

## Creation and Formation safeguards

- FH-P1–FH-P4 govern evidence, release, usable truth and remedy.
- FH-P5–FH-P6 keep deeper control and growth behind capacity gates.
- FH-P7 applies to source records and claims.
- FH-P8–FH-P9 require economics and multiplication evidence before growth or non-founding additions.
- FH-P10 keeps creator ownership at or above 51 percent.
- FH-P11 keeps founding return separate from current labour.
- FH-P12 keeps the Flaxx mark attached to the evidence standard.
- F1–F8 remain visible through entity records, Spring and Account records, role forms, Garden records, River records, mandates, encounter records and continuation records.

The backend may enforce an approved rule. It may not issue Beginning, reinterpret a principle, appoint an operator, declare Rest, or turn a prototype into operating permission.

## Present prototype and production replacement

The current build proves the record map, policy checks, role segregation, work queues and scoped internal channels. Before any live customer or employee data enters Core, replace development role selection and JSON storage with managed identity, MFA, a transactional database, encrypted object storage, secrets management, rate limiting, monitoring, immutable audit retention, backup, recovery, privacy controls and tested incident response.

Payment, tax, email, shipping, fulfilment, analytics, accounting and content-production integrations remain disabled until their Formation gates and named human authorities pass. Integrations receive the smallest access needed and must support replacement without breaking the entity record.
