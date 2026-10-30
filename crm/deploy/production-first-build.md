# Legacy Water CRM production — first build marker

This documentation-only commit is intended to trigger the first Cloudflare Git build for the **private CRM dashboard Worker** named `legacy-water-crm`.

Deployment safety constraints:
- Branch: `release/legacy-crm-production`.
- Wrangler config: `crm/wrangler.production-dashboard.toml`.
- Database: `legacy-water-crm-production` (never staging or public lead storage).
- `workers_dev = false` and `preview_urls = false`.
- Worker Access must remain **All traffic / Legacy CRM - Owner Only**.
- Runtime secret `CRM_ALLOWED_EMAILS` must remain encrypted and configured.
- No custom domain or public Pages integration is enabled by this commit.

This marker includes no customer information, credentials, or executable application changes.
