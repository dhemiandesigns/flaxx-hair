# Flaxx Core — governed backend prototype

This is the first F4 shared-core vertical slice for the Garden and the later Flaxx office. It serves the private website, the role-specific Core workspace, and a JSON API without third-party dependencies. It is a Formation prototype, not authorization for public commerce.

## What it enforces now

- role permissions and separate approval types;
- immutable audit events for every mutation;
- claim activation only with current linked evidence plus Product & Quality and Compliance confirmations;
- release only when the documented gate passes, no applicable stop is open, and the required independent confirmations exist;
- FH-P12 mark use only after Creator, Product & Quality, and Compliance confirmation;
- FH-P10 ownership check at 51% or more;
- quarantine-to-sellable inventory transition only through a passing release;
- public catalogue suppression while commerce is blocked;
- compliance stops lifted only through resolution evidence;
- atomic, exportable JSON persistence for this prototype.
- collection-level and department-level access boundaries;
- separate role views for the First Operator, Market and Brand Operator, Product and Quality, Compliance, Finance, Customer Operations, Community, Fulfilment and Systems;
- role-scoped task ownership, follow-up history, notifications and internal channels;
- backend records corresponding to catalogue, media, pricing, promotions, favourites, carts, waitlists, community, reviews, payments, refunds and pack events on the public Garden;
- a narrow community financial view that exposes community-member payment status without exposing the entity's accounts.

## Run locally

Use Node 20 or later:

```sh
FLAXX_DEV_MODE=1 npm start
```

The application runs at `http://127.0.0.1:4174`. Open `http://127.0.0.1:4174/core/` for the private prototype. Development requests to Core routes require an `X-Flaxx-Role` header. Production-like use requires role-specific bearer tokens supplied only through environment variables; no credential belongs in source control.

## Still required before activation

Replace development authentication and JSON persistence with qualified managed identity, MFA, database, object storage, encrypted backups, monitoring, and tested recovery. Connect Stripe, tax, shipping, fulfilment, email, privacy/consent, and accounting only after their Formation gates. Create and approve the actual specifications, inspections, claims, terms, remedies, contracts, role appointments, and permission matrix. Run security, privacy, accessibility, failure-path, payout, refund, recall, and whole-Garden tests.
