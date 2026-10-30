# CRM Legacy Water USA — staging activation checklist

## Recovery from first Cloudflare Git deployment error (29 Oct 2026)

If the initial Worker build shows `main` + root directory `/` + `npx wrangler deploy` and fails because the repository contains a `functions/` directory, **do not retry unchanged**. That command tried to autoconfigure the entire public Pages site as a Worker; it did not target the CRM.

The **GitHub-managed staging dashboard** is configured in `crm/wrangler.stage-bootstrap.toml`. It builds only `crm/src/worker.js` under `legacy-water-crm-stage`, disables workers.dev and preview URLs, binds **only** the separate `legacy-water-crm-staging` D1, and fails closed if the Worker secret `CRM_ALLOWED_EMAILS` is missing. Despite its historic filename, this file now contains the staging database binding.

In the **existing** Cloudflare Worker project `legacy-water-crm-stage`, change:
1. `Settings → Build → Branch control`: production branch to `feature/legacy-private-crm-mvp`; leave preview builds disabled.
2. `Settings → Build → Build configurations` (exact label may vary): deploy command to `npx wrangler deploy --config crm/wrangler.stage-bootstrap.toml`. The root directory may remain `/` because the explicit config path handles the monorepo. Build command can be empty.
3. Confirm `Protect with Cloudflare Access` for this Worker only (and NOT the account-wide switch), or keep it without any route/hostname as defined by the config. Do not grant public Access.
4. Retry the failed build **only after** verifying the selected Git branch and command, or push a change to trigger a new build. Confirm its log references the feature branch and the bootstrap config; stop if it still references `main` or the root auto-configuration.

**Important:** The staging Worker now binds `legacy-water-crm-staging`, but **remains inaccessible** without the separately configured `CRM_ALLOWED_EMAILS` secret and approved Cloudflare Access identity. Do not expose a custom domain before end-to-end access checks.


**Status (29 Oct 2026):** Staging D1 created and its three tables verified; dashboard Worker originally deployed with route-free bootstrap, and Cloudflare Access `Legacy CRM - Owner Only` applied to all traffic. GitHub now has the D1 binding, but the NEW remote build must still be verified and Worker secret `CRM_ALLOWED_EMAILS` configured before any browser testing. No production customers, database or hostname should be changed.

## Immediate next steps after D1 UUID was supplied

1. Check **Workers & Pages → legacy-water-crm-stage → Deployments**. Confirm a **new** successful deployment from branch `feature/legacy-private-crm-mvp` after the D1-config commit, not just the earlier route-free deployment. In that build, the bindings section should include `DB` mapped to `legacy-water-crm-staging`. Do not infer this from GitHub CI alone.
2. In **Worker → Settings → Variables and Secrets**, add `CRM_ALLOWED_EMAILS` as a **Secret**, with exactly the individually authorized owner email from the Access policy. No tokens should be copied into a chat or committed. Deploy the secret in the dashboard. The Wrangler config includes `keep_vars = true`, and Cloudflare retains existing secrets on subsequent code deployments.
3. Reopen **Worker → Access** and verify `All traffic` and only the named `Legacy CRM - Owner Only` allow policy. Then check **Domains/Triggers** for no unintended publicly reachable route, preview, or `workers.dev` hostname. A Worker-level Access policy is not a substitute for checking alternate hostnames and more specific hostname rules.
4. After verifying both conditions, choose a **staging-only** custom hostname if desired. Test unauthenticated access in a private browser session, then the authorized account, and verify `/api/me`, `/api/summary`, and an empty `/api/leads` response. If a test fails, disable the hostname and diagnose before any lead import.
5. Do **not** connect staging Pages form mirroring or real customer records during this stage; the internal ingest Worker needs its own service binding and an encrypted `CRM_INGEST_TOKEN` first.

The D1 UUID is a Cloudflare resource ID, **not a password or authorization secret**. It is deliberately recorded for staging binding reproducibility. Protect the Cloudflare account and Access policies separately.

## Current verified architecture

| Resource | Staging name | Public exposure |
|---|---|---|
| D1 for CRM only | `legacy-water-crm-staging` | No public binding |
| Staff dashboard Worker | `legacy-water-crm-stage` | No route until Worker-level Access is enabled |
| Intake Worker | `legacy-water-crm-ingest-stage` | Never a public route |
| Pages source | Existing staging Pages site only | Already public, form remains source of truth |

The production CRM names in `wrangler.example.toml` are not to be used for this first test. The dashboard's GitHub build uses `crm/wrangler.stage-bootstrap.toml` with the existing stage D1 ID. Separate generation using `crm/deploy/prepare-staging.mjs` remains available for a future internal ingestion Worker deployment.

## Step 1 — Account owner, Cloudflare dashboard

1. Open **Cloudflare → Storage & databases → D1 → Create database**.
2. Name the new database `legacy-water-crm-staging`. Confirm it is **not** `legacy-water-leads` or `legacy-water-leads-staging`.
3. Confirm its UUID is the existing staging database ID recorded in `crm/wrangler.stage-bootstrap.toml` (resource identifier, not a secret). Never replace it with the customer lead database ID.
4. Take note of its account and the existing staging Pages project. Do not change production.

## Step 2 — On a trusted terminal with an authorized Wrangler login

From the repository root, on the CRM feature branch:

```bash
# Use your private staging database UUID locally; don't commit or share it.
CRM_STAGING_D1_ID='YOUR_PRIVATE_STAGING_D1_UUID' node crm/deploy/prepare-staging.mjs

# Inspect both generated configs first:
# crm/wrangler-stage-dashboard.toml
# crm/wrangler-stage-ingest.toml

# Migrate ONLY the separate remote staging database, after verifying the name.
npx wrangler d1 execute legacy-water-crm-staging --remote --config crm/wrangler-stage-dashboard.toml --file crm/schema.sql

# Confirm no records at start.
npx wrangler d1 execute legacy-water-crm-staging --remote --config crm/wrangler-stage-dashboard.toml --command 'SELECT COUNT(*) AS total FROM crm_leads'

# Deploy services with workers.dev and preview URLs disabled.
npx wrangler deploy --config crm/wrangler-stage-dashboard.toml
npx wrangler deploy --config crm/wrangler-stage-ingest.toml
```

**Stop and check each step's output.** Never proceed if the database name or account differs from the staging resources. These commands are examples to run in the authenticated user's environment; they have **not** been executed from this conversation.

The D1 migration is add-only (CREATE TABLE IF NOT EXISTS). Take a backup/snapshot before a future migration on a populated database.

## Step 3 — Lock down the dashboard before adding a public route

1. In **Workers & Pages → `legacy-water-crm-stage` → Access**, select **Protect this Worker** for **all traffic** (production and previews, not previews only). Cloudflare Zero Trust may require initial setup.
2. Allow **specific individually approved emails/accounts**, not an entire email domain, "everyone", or a bypass rule.
3. Add `CRM_ALLOWED_EMAILS` on the dashboard Worker, containing only the approved email(s). No real customer data is needed yet.
4. Ensure `ctx.access.getIdentity()` returns the actual approved user and disallowed visitors cannot read `/api/leads` or `/api/summary`. The Worker additionally enforces the email allowlist.
5. **Only after this protection exists**, optionally attach a staging hostname such as `crm-stage.legacywaterusa.com`. Confirm that the Access policy covers this domain as well as any previews. Never attach a hostname to the ingestion Worker.

## Step 4 — Connect the two services, without touching production

1. Create an unpredictable 32+ character secret locally. Set **the same** `CRM_INGEST_TOKEN` as encrypted secrets in (a) the ingestion Worker and (b) **the existing staging Pages project**. Do not place it in GitHub Actions, files, browser code or this chat.
2. In the **staging Pages project → Settings → Bindings → Add → Service binding**, set `CRM_SERVICE` to Worker `legacy-water-crm-ingest-stage`.
3. Deploy the **CRM feature branch to staging Pages**; do not change the public production site's branch. Confirm the Pages `DB` binding still points only to `legacy-water-leads-staging`.
4. Test only using a fabricated name and a testing phone number that you control. A new lead should be stored in staging Pages D1 and then copied to CRM staging D1; public lead registration and existing email alert should work if the CRM is temporarily unavailable.
5. Confirm the CRM shows the lead once, that repeated submissions with the same request ID do not duplicate the lead, and the campaign source remains attached. **Do not test with a real customer's data** yet.

## Step 5 — Go/no-go conditions

- [ ] Account, database IDs, Worker names, and Pages project are confirmed to be **staging**.
- [ ] Schema exists in new staging CRM D1 and starts empty.
- [ ] No `workers.dev`/preview route or custom domain reaches `legacy-water-crm-ingest-stage`.
- [ ] Cloudflare Access protects **all** dashboard Worker traffic, and only explicitly approved identities can sign in.
- [ ] Both staging API endpoints deny unauthenticated traffic.
- [ ] Public staging D1 saves the test lead regardless of internal CRM mirror availability.
- [ ] Private staging CRM receives exactly one lead and can update its status and notes.
- [ ] Mobile Safari and desktop UI manual checks pass, including opening/closing drawer and keyboard.
- [ ] No production D1 bindings, domains, or Pages branches were changed.

If a test fails, **keep all production services unchanged**. Remove the staging Pages `CRM_SERVICE` binding to stop mirroring and redeploy staging Pages. Keep or delete staging records according to test-data retention needs.

## Existing GitHub checks
- [CRM staging readiness](../.github/workflows/crm-staging-readiness.yml): validates local SQLite D1 schema, generates synthetic configs, and compiles both Workers using `wrangler deploy --dry-run`. Uses **no Cloudflare token**, does **not deploy**.
- [CRM safety tests](../.github/workflows/crm-tests.yml)
- [Visual CRM demo tests](../.github/workflows/crm-visual-tests.yml)

## Important limitation

The connected tools in this conversation can edit GitHub but **cannot create D1 resources, Worker secrets, Access policies, hostnames, or Cloudflare deployments** in the customer's Cloudflare account. Those steps require explicit access through an authenticated Cloudflare session, or a separately authorized deployment workflow. Never paste a Cloudflare API token into this chat.
