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
        └── Cloudflare Service Binding CRM_SERVICE
                + shared server-only secret CRM_INGEST_TOKEN
                -> private Worker: legacy-water-crm-private
                      ├── /internal/ingest (token required)
                      ├── /api/... (Cloudflare Access authenticated)
                      └── D1: legacy-water-crm-private (SEPARATE)
```

## Safe deployment checklist

### Step 1 — Create isolated database
- In Cloudflare Dashboard > Workers & Pages > D1, create a **new database** `legacy-water-crm-private`. Do not reuse `legacy-water-leads` or `legacy-water-leads-staging`.
- Make a database backup. Apply `crm/schema.sql` **only to this new CRM DB** (for example, through D1 Console or `wrangler d1 execute`). The schema stores personal information: full names, numbers and notes. Enforce least privilege.
- In a separate staging environment, use a different D1 database and disposable records.

### Step 2 — Deploy a separate Cloudflare Worker, not a Pages route
- From the `crm/` folder, copy `wrangler.example.toml` to `wrangler.toml` and replace `REPLACE_WITH_PRIVATE_CRM_DATABASE_ID` with the **new CRM** D1 ID. `wrangler.toml` and secrets are gitignored.
- Run `npx wrangler deploy` using an authorized Cloudflare session; this project intentionally specifies `workers_dev=false` and `preview_urls=false`. A Worker may have no public hostname immediately after deployment.
- Attach a **separate custom subdomain** (e.g. `crm.legacywaterusa.com`) to the Worker, not the public Pages project. Verify there is no public alternate route or preview address.
- In Workers & Pages > this Worker > Access, **Protect this Worker** (not just one hostname) with Cloudflare Access covering production and previews, and create an explicit allow policy only for the owner or approved staff. Do **not** enable an Everyone/bypass Access policy.
- Configure Worker environment variable `CRM_ALLOWED_EMAILS` containing only the approved email addresses, separated by commas. The Worker refuses all dashboard/API access when Access identity or this allowlist is missing, even if an Access rule is accidentally bypassed. `ctx.access.getIdentity()` is trusted only when provided by Cloudflare.
- Configure an encrypted `CRM_INGEST_TOKEN` secret of 32+ unpredictable characters. **Never** put this in a repository, URL, frontend asset, page HTML or log. Rotate if suspected compromised.

### Step 3 — Connect public Pages using a private service binding (first in staging)
- In Cloudflare Pages for the **staging project** go to Settings > Bindings > Add > Service binding. Use variable name `CRM_SERVICE`; select the private CRM Worker in the same Cloudflare account.
- Set encrypted Pages secret `CRM_INGEST_TOKEN` to the same value as on the CRM Worker.
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
- The internal endpoint is reachable through Service Binding and requires a separate high-entropy shared secret. Restrict access to the Worker at the Cloudflare routing layer in addition to this control.
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
- `crm/src/worker.js`: Access checks, API, ingestion and D1 operations.
- `crm/src/ui.js`: static, Spanish-first interface with no framework or external CDNs.
- `functions/_shared/crm-sync.js`: optional, private service-bound mirror.
- `crm/schema.sql`: **private database only**.
