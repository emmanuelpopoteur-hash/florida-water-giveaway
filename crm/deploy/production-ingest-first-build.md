# Legacy Water CRM — first internal production ingestion build

A documentation-only marker commit to trigger the first GitHub-connected Cloudflare Workers Build for `legacy-water-crm-ingest`.

- Production branch: `release/legacy-crm-production`
- Wrangler config: `crm/wrangler.production-ingest.toml`
- D1 binding `DB`: `legacy-water-crm-production`
- Encrypted runtime secret `CRM_INGEST_TOKEN` is configured in Cloudflare, not committed to source control
- Public workers.dev URLs, preview URLs and custom domains must remain disabled
- No production Pages/Resend integration is enabled by this commit
- This commit does not alter executable source code or customer data

Check the Worker deployment after this commit; successful deployment alone does not confirm operational ingestion.
