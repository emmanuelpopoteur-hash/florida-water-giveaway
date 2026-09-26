# Legacy Water USA Cloudflare migration

This branch is staging only. Keep the current production domains and lead form active until the D1 test below succeeds.

## Target setup

1. Create a Cloudflare Pages project connected to `emmanuelpopoteur-hash/florida-water-giveaway` and this staging branch. Root directory: repository root. Build command: `node scripts/build-cloudflare.mjs`. Build output directory: `dist`. The `functions` directory stays at the project root, outside `dist`.
2. Create a D1 database named `legacy-water-leads`. Apply `schema.sql` to the database using the Cloudflare dashboard's D1 Console or Wrangler.
3. In Pages Settings > Bindings, bind this D1 database as `DB` for Preview and Production. Redeploy after adding bindings. Never put credentials or lead data in GitHub.
4. In the preview homepage, search ZIP `34771`, choose the provider shown on a bill, then follow the request button. The `/check/` form should prefill `34771` without advancing automatically. Submit a disposable test lead with a day and time, a clearly marked test name, and a phone number authorized for testing. Confirm the page shows success only after the API returns `201 {saved:true,id}`. A retry of the exact same request ID returns `200 {saved:true,id}` without a second row; a changed request using that ID returns `409`.
5. In the D1 Console, query `SELECT id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest FROM water_test_leads ORDER BY created_at DESC LIMIT 10;` and match the returned id. Remove the disposable row after verification if desired.
6. Test invalid ZIP, missing binding, and readback failure paths. They must never show success. Check mobile and both languages.
7. Only after those checks, merge the migration, assign custom domains, and move DNS. The staging branch already points homepage and water-test calls to action to `/check/`; main remains on the existing live flow until merge. Preserve existing leads in Netlify Blobs with a separate export/retention plan; this change does not migrate historical leads.

Lead storage: Cloudflare D1 database `legacy-water-leads`, table `water_test_leads`, accessible through Cloudflare dashboard > D1 > database > Console. There is no public lead listing route.

The `/check/` form preloads the ZIP from the homepage search. The visitor still confirms it before advancing. The form's existing three-step behavior, language controls, and historical EWG preview are retained. The free home visit does not identify each EWG contaminant; it measures only the parameters actually tested on site.
