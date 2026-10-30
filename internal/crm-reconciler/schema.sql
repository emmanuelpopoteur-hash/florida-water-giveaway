-- Run ONLY in production public D1: legacy-water-leads.
-- Non-destructive: references the existing water_test_leads rows by ID.
-- Never run this schema on legacy-water-crm-production or any staging database.
CREATE TABLE IF NOT EXISTS crm_sync_receipts (
  lead_id TEXT PRIMARY KEY REFERENCES water_test_leads(id) ON DELETE CASCADE,
  first_seen_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  delivered_at TEXT,
  last_http_status INTEGER,
  last_result TEXT NOT NULL DEFAULT 'pending'
    CHECK(last_result IN ('pending','accepted','rejected','service_call_failed'))
);
CREATE INDEX IF NOT EXISTS crm_sync_receipts_due
  ON crm_sync_receipts(delivered_at, next_attempt_at);

-- Read-only queue inspection (after activation):
-- SELECT w.created_at, w.source, w.campaign, r.attempts, r.last_result,
--        r.last_http_status, r.next_attempt_at, r.delivered_at
-- FROM water_test_leads w LEFT JOIN crm_sync_receipts r ON r.lead_id=w.id
-- WHERE (w.source LIKE 'water-test-%' OR w.source='ro-product-website')
-- ORDER BY w.created_at DESC LIMIT 20;
