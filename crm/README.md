# Legacy Water USA | CRM privado v0.1

**Status: code-only MVP, not deployed.** Keep production Legacy Water USA and the production D1 `legacy-water-leads` unchanged until tested in staging. This CRM is a **separate Cloudflare Worker + separate D1 database**, not a public page under `legacywaterusa.com`.

## Features
- Spanish-first, responsive, simple status summary: total, new, followups due and closed sales.
- Search by name, ZIP, phone; filter by sales stage.
- Lead details including attribution `source` and `campaign`, optional RO/city/well interest, and customer call link.
- Update status, assign responsibility, estimate/closed values and next-followup date.
- Notes and audit history in private D1, independent of the public website DB.
- Create an in-person/manual prospect for door knocking or customer referrals.
- The RO inquiry form now forwards a validated `utm_campaign` label into the existing D1 `campaign` field, so a QR printed for `ro-information-card` remains attributable through the CRM. The regular water-test form already supports UTM campaign tags.
- Receives **newly confirmed** submissions from Pages endpoints `/api/leads` and `/api/ro-inquiries` over a Cloudflare Service binding. Once a lead is written into the existing public D1, its details are **best-effort mirrored**; CRM failure must not break the original registration. Existing Resend alerts are preserved.
- No new vendor subscription, no checkout, no AI access to PII, no automatic marketing, no imports to third-party CRMs.

## Architecture

```text
legacywaterusa.com  (public Cloudflare Pages)
  ├── /api/leads            -> D1: legacy-water-leads (source of truth)
  └── /api/ro-inquiries     -> D1: legacy-water-leads (source of truth)
        └── Service Binding CRM_SERVICE + CRM_INGEST_TOKEN
                -> internal-only Worker: legacy-water-crm-ingest
                      └── D1: legacy-water-crm-private (SEPARATE)

crm.legacywaterusa.com
        └── Access-protected Worker: legacy-water-crm-private
              ├── /            (dashboard)
              ├── /api/...     (approved sales staff)
              └── same PRIVATE CRM D1 as the ingestion Worker
```

## Safe deployment checklist

### Step 1 — Create isolated database
- In Cloudflare Dashboard > Workers & Pages > D1, create a **new database** `legacy-water-crm-private`. Do not reuse `legacy-water-leads` or `legacy-water-leads-staging`.
- Make a database backup. Apply `crm/schema.sql` **only to this new CRM DB** (for example, through D1 Console or `wrangler d1 execute`). The schema stores personal information: full names, numbers and notes. Enforce least privilege.
- In a separate staging environment, use a different D1 database and disposable records.

### Step 2 — Deploy a separate Cloudflare Worker, not a Pages route
- Deploy **two separate Workers** against the **same private CRM D1 database**. The dashboard Worker is `legacy-water-crm-private` (source `src/worker.js`); the ingestion Worker is `legacy-water-crm-ingest` (source `src/ingest.js`). Keep staging and production resources separate.
- Copy `crm/wrangler.example.toml` to a local `crm/wrangler.toml`, replace `REPLACE_WITH_PRIVATE_CRM_DATABASE_ID` with the **new CRM** D1 ID, then deploy with `npx wrangler deploy --config crm/wrangler.toml` from the repository root. Local Wrangler files and secrets are gitignored.
- For the **ingest Worker**, copy `crm/wrangler-ingest.example.toml` into a second local configuration file, substitute the **same private CRM D1 ID**, and deploy using `npx wrangler deploy --config <local-ingest-config>`. Keep `workers_dev=false`, `preview_urls=false` and **no custom domain or route**. Do not give this Worker a public HTTP entry point; it only receives Service Binding invocations.
- Attach a separate custom subdomain (e.g. `crm.legacywaterusa.com`) **only to the dashboard Worker**. In its **Access** tab choose **Protect this Worker** for all traffic and a policy limited to approved staff. Do not add an Everyone/bypass policy; verify all production and preview destinations are covered.
- Set `CRM_ALLOWED_EMAILS` **only on the dashboard Worker** with approved emails. The dashboard rejects requests without valid `ctx.access` identity and matching allowlist.
- Set the encrypted `CRM_INGEST_TOKEN` (32+ unpredictable characters) **only on the ingest Worker and originating Pages project**, with identical values. Never place the token in GitHub, frontend, URLs or logs. Rotate if leaked.
- Cloudflare Access does not propagate `ctx.access` over Service Bindings; the two-Worker split prevents ingress and dashboard authorization policies from being conflated.

### Step 3 — Connect public Pages using a private service binding (first in staging)
- In Cloudflare Pages for the **staging project** go to Settings > Bindings > Add > Service binding. Use variable name `CRM_SERVICE`; select **legacy-water-crm-ingest** in the same Cloudflare account (not the dashboard Worker).
- Set encrypted Pages secret `CRM_INGEST_TOKEN` to the same value as on the **ingest Worker**.
- Redeploy Pages after configuring the binding. Because `CRM_SERVICE` is optional in code, existing forms work with no CRM binding; the original public D1 remains authoritative.
- Submit a **disposable authorized** test lead via staging and verify: public D1 has a single row, private CRM D1 has one matching ID, the private CRM displays it, and Resend still sends the original owner alert.
- Confirm repeated request IDs do **not** create duplicate CRM entries; test a temporary broken CRM binding and confirm public lead registration is still successful.
- Once staging passes, add the service binding and secret to the public Pages **Production** environment and redeploy. No website DNS changes are required if the public Pages project is already live.

### Step 4 — Historical leads and reconciliation
- Mirroring applies **only to new inserts**. Existing production leads stay in `legacy-water-leads`; backfill them with a **separately approved, private, one-time data migration** after checking original consent and retention requirements. Never export raw customer data into GitHub.
- If an internal mirror attempt fails, the original lead stays stored; this MVP logs a sanitized failure but **does not provide a durable retry queue**. Schedule a periodic private D1-to-D1 reconciliation mechanism before relying on it for guaranteed delivery. Consider Cloudflare Queues or a controlled bulk sync once staffing needs increase.
- Fields in `ro_email_requests` from the separate RO email PR are intentionally **not imported**. A person requesting one informational email has not necessarily consented to a sales follow-up.

## Security and operational limits
- All dashboard and API routes require a Cloudflare Access-authenticated `ctx.access` identity whose email is in `CRM_ALLOWED_EMAILS`. Never trust an arbitrary client-supplied email header.
- The **ingest Worker** has no internet-facing route or custom domain. It accepts only POST /internal/ingest with a matching high-entropy token delivered by a private Service Binding. The dashboard Worker does not implement that endpoint.
- Browser mutations require exact same-origin `Origin`; customer notes are rendered with `textContent`, not HTML.
- Responses use `Cache-Control: private, no-store` and a strict Content Security Policy.
- This MVP supports up to 2,000 results of offset pagination; search and filter across those paginated rows using D1. For very large volume, move to cursor pagination.
- No automated appointment confirmations, bulk email/SMS, AI-generated customer communication, financial transactions, or promises of specific installations.
- CRM currently tracks up to 7 sales stages: new, contacted, qualified, proposal, scheduled, won, lost. Enter a follow-up date; automatic push reminders are not yet enabled.
- Create a data-retention and export/deletion policy before production deployment and arrange role-based access/revocation for future employees.

## Automated tests
`node --check crm/src/worker.js && node --test tests/crm-worker.test.mjs`

GitHub Actions workflow: `.github/workflows/crm-tests.yml`.

## Developer notes
- `crm/src/worker.js`: Access checks, staff API and D1 operations.
- `crm/src/ingest.js`: server-to-server ingestion without public routes, with independent secret.
- `crm/src/ui.js`: static, Spanish-first interface with no framework or external CDNs.
- `functions/_shared/crm-sync.js`: optional, private service-bound mirror.
- `crm/schema.sql`: **private database only**.

## UI demonstration (fabricated data only)
- Preview server: `crm/dev/preview-server.mjs` binds only to 127.0.0.1 and refuses to run unless `CRM_ENABLE_LOCAL_DEMO=1` or `CI=true`.
- Screenshots and visual journeys: `.github/workflows/crm-visual-tests.yml`; use its `legacy-crm-demo-screenshots` artifact to review desktop and mobile UI.
- Local developer: install `@playwright/test` and Chromium/WebKit, then run `npx playwright test -c crm/playwright.config.mjs` with `CI=true` (or `CRM_ENABLE_LOCAL_DEMO=1`). Never replace demo names/phone numbers with actual customer data.
- **This is a visual test only**. It does not verify real Cloudflare Access, production D1 or live ingestion; staging remains required.
