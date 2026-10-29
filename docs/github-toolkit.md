# Legacy Water USA — GitHub toolkit

## Applied in this branch

### 1. Gitleaks — secret leak detection
- GitHub Action: `.github/workflows/security-gitleaks.yml` (official Gitleaks Action v3).
- Runs on changes and pull requests, without embedding Resend, Cloudflare or other API secrets in code.
- A clean scan is not a guarantee. If a secret ever leaked in Git history, rotate it even if the check later passes.
- Gitleaks Action is usable for personal GitHub accounts without an organization license. Confirm license/terms before installing in an organization.

### 2. Playwright — desktop and mobile Safari checks
- GitHub Action: `.github/workflows/website-quality.yml`.
- Builds a local copy of the static Cloudflare Pages website. **Does not call real lead-submission APIs, change D1, charge cards or send emails.**
- Checks: homepage assistant open/close and question, RO page mobile chat placement, Colombia no-US-price rule, Florida water test availability.
- For local runs: install `@playwright/test`, run `node scripts/build-cloudflare.mjs`, `npx playwright install chromium webkit`, and `npx playwright test`.
- These automated checks are a safety net, not a replacement for actual iPhone keyboard testing or Cloudflare Functions integration tests.

### 3. node-qrcode — printable, campaign-specific QR images
- Data: `campaigns/qr-campaigns.json`; generator: `scripts/generate-campaign-qrs.mjs`; URL builder: `scripts/campaign-links.mjs`.
- GitHub Action produces a **legacy-water-tracked-qr** artifact, containing transparent? **No**: high-contrast PNG and SVG assets with white background, plus `links.json`.
- Campaigns:
  - `water-test-direct`: cards → `/check/` three-step intake.
  - `door-hanger-water-entry`: door hangers → `/water-test/` → optional intake.
  - `ro-information-card`: US RO catalog → `/ro/`.
- Parameters `utm_source=qr&utm_medium=print&utm_campaign=...` distinguish inbound campaigns. The /check/ flow already forwards them to the D1 lead campaign field. The two informational pages route to relevant flows without adding a new database.
- QR generation happens inside GitHub Actions, not the site or an external QR-tracking service. The printed link remains valid as long as the destination path remains available.
- Before printing large batches, open each PNG on another phone, scan at the intended print size, confirm the destination and check that attribution reaches the lead database after an authorized test submission.
- The QR generation artifact is retained for 30 days. Run workflow manually again if assets are needed later.

## Deployment safety
- This is a **draft pull request**, not an automatic deployment to the live Legacy Water USA site.
- The existing `cloudflare-migration` branch and D1 databases remain unchanged by this branch.
- There are no added runtime dependencies for the published site: Playwright and QR libraries are installed transiently in GitHub Actions only.
- No user/customer email or phone number is present in generated QR assets.
- Keep the separate RO email feature PR separate until Cloudflare D1/KV/Resend configuration has been tested.

## Later choices — do not install without operational planning
- **CRM:** Maintain the agreed private Cloudflare Worker + separate D1 + Cloudflare Access CRM MVP rather than automatically replacing it with Twenty, which needs PostgreSQL/Redis hosting and data migration.
- **Uptime Kuma:** Requires an always-on host/container and private credentials; set up separately only when a supported monitoring host and notification channel are ready.
- **Activepieces/n8n:** Evaluate for lead→follow-up automations after a robust CRM, opt-in policy, credentials and retry/de-duplication are in place.
- **Chatwoot:** Evaluate for unified human inbox only when we actually need staff conversations beyond the current guided assistant.
- **Dify:** Evaluate after the existing advisor's facts, rules and permission boundaries are stable, with server-side secret management.
- **Formbricks/Cal.com:** Lower priority because the current lead form already works and we do not yet publish confirmed visit slots.
