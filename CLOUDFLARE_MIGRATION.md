# Legacy Water USA Cloudflare migration

This branch is staging only. Keep the current production domains and lead form active until the D1 test below succeeds.

## Target setup

1. Create a Cloudflare Pages project connected to `emmanuelpopoteur-hash/florida-water-giveaway` and this staging branch. Root directory: repository root. Build command: `node scripts/build-cloudflare.mjs`. Build output directory: `dist`. The `functions` directory stays at the project root, outside `dist`.
2. Create a D1 database named `legacy-water-leads`. Apply `schema.sql` to the database using the Cloudflare dashboard's D1 Console or Wrangler.
3. In Pages Settings > Bindings, bind this D1 database as `DB` for Preview and Production. Redeploy after adding bindings. Never put credentials or lead data in GitHub.
4. Open the Pages preview URL `/check/`. Submit a disposable test lead with ZIP `34771`, a day and time, a clearly marked test name, and a phone number authorized for testing. Confirm the page shows success only after the API returns `201 {saved:true,id}`.
5. In the D1 Console, query `SELECT id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest FROM water_test_leads ORDER BY created_at DESC LIMIT 10;` and match the returned id. Remove the disposable row after verification if desired.
6. Test invalid ZIP, missing binding, and readback failure paths. They must never show success. Check mobile and both languages.
7. Only after those checks, merge the migration, change the homepage's test links to `/check/`, assign custom domains, and move DNS. Preserve existing leads in Netlify Blobs with a separate export/retention plan; this change does not migrate historical leads.

Lead storage: Cloudflare D1 database `legacy-water-leads`, table `water_test_leads`, accessible through Cloudflare dashboard > D1 > database > Console. There is no public lead listing route.

The `/check/` form repeats the ZIP if the visitor arrived from the homepage search. The form's existing three-step behavior, language controls, and historical EWG preview are retained. The free home visit does not identify each EWG contaminant; it measures only the parameters actually tested on site.
