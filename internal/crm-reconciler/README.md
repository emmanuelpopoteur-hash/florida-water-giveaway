# Private automatic reconciliation — Legacy Water USA

Status: **proposed code**, not active until a separate private scheduled Worker is created and verified.

## Purpose
Recover consented `/api/leads` and `/api/ro-inquiries` requests already saved to the production public D1 `legacy-water-leads` if the best-effort CRM mirror fails. Public Pages and Resend are unchanged. This Worker also verifies previously mirrored IDs once; the private ingest worker's idempotent `INSERT OR IGNORE` avoids duplicate prospects.

## Security boundaries
- Never deploy as a Pages Function or attach any public URL, route, workers.dev or preview URL.
- Separate Worker named `legacy-water-crm-reconciler` runs on **Cron Triggers** (every 5 minutes, UTC).
- Bind **DB** to production **public source D1** `legacy-water-leads`, **not** private CRM D1.
- Bind **CRM_SERVICE** to the **internal** Worker `legacy-water-crm-ingest`, not the public CRM dashboard.
- Add encrypted **CRM_INGEST_TOKEN** secret, exact same value as on ingest Worker, length >= 32 characters. Do not write it to GitHub.
- The separate `legacy-water-crm-ingest` Worker alone writes the private CRM D1.
- No PII or secret values in Worker logs or receipt records. Never publicly expose the D1 Console.

## Activation procedure
1. Create a backup/bookmark of `legacy-water-leads`.
2. Execute `schema.sql` **only** in `legacy-water-leads` (public production).
3. Inspect new table with `SELECT COUNT(*) FROM crm_sync_receipts;` (should be 0).
4. Copy `wrangler.production.example.toml` to `wrangler.production.toml` and replace its placeholder with the actual **production public D1 database ID** (obtain under Cloudflare D1 settings). Do not guess this ID or reuse the private CRM D1 ID.
5. Deploy from repository root with `npx wrangler deploy --config internal/crm-reconciler/wrangler.production.toml`, or configure an equivalent Cloudflare Git-integrated Worker and deploy command. This step creates a **new Worker**; existing Pages and CRM Workers are not redeployed.
6. In the new Worker settings, set `CRM_INGEST_TOKEN` encrypted to match the private ingestion Worker. Check `workers.dev`/preview OFF and routes/domains empty.
7. Validate with a **single disposable authorized form request**, verify mirrored CRM record and `crm_sync_receipts` transitions to `accepted`; then clean its exact records from both D1s.
8. Read Cron event history and query `crm_sync_receipts` for errors/backlog. Test a simulated temporary failure only in staging, not by intentionally breaking live auth.

## Queries (production public D1)
```sql
SELECT w.created_at,w.source,w.campaign,
       COALESCE(r.last_result,'pending') AS sync_status,
       COALESCE(r.attempts,0) AS attempts, r.last_http_status,
       r.next_attempt_at,r.delivered_at
FROM water_test_leads w
LEFT JOIN crm_sync_receipts r ON r.lead_id=w.id
WHERE w.source LIKE 'water-test-%' OR w.source='ro-product-website'
ORDER BY w.created_at DESC LIMIT 25;
```
When a recent lead has `sync_status='pending'`, the next scheduled run can process it. If it is already in CRM from the immediate mirror, the receiver responds 200 and the scheduled Worker records its receipt.
Failed attempts back off exponentially, up to once a day. The next scheduled event processes a batch of up to 20. No autonomous email/marketing occurs.

## Limitations
- Requires a correctly configured Worker, scheduled trigger, and D1 table; this code alone does not enable anything.
- A prolonged Cloudflare outage, broken token/binding, or D1 failure can still delay delivery. Monitor backlog/cron errors. It is an at-least-once reconciliation process, not a strict zero-loss guarantee.
- Very high volume (20+ overdue leads every five minutes) may require larger batches and performance tuning.
- This only reads `water_test_leads`, not separate `ro_email_requests` or chatbot transcripts, which may not constitute sales leads.
- Do not delete or purge an unsynchronized public lead; the reconciler cannot recover records that no longer exist.
