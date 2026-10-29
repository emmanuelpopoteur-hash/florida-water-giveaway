-- Run once against the existing production D1 database bound as DB.
-- Stores only one-time requested product emails, not marketing subscriptions.
CREATE TABLE IF NOT EXISTS ro_email_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL,
  product TEXT NOT NULL CHECK(product IN ('essential','advanced','premium')),
  language TEXT NOT NULL CHECK(language IN ('es','en')),
  consented_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted')),
  accepted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ro_email_requests_created ON ro_email_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ro_email_requests_email ON ro_email_requests(email);
