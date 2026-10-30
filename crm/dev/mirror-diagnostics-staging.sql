-- STAGING ONLY: execute against D1 "legacy-water-leads-staging".
-- Does not change existing tables or production data.
-- Only outcome labels and numeric HTTP statuses are stored; never lead details or secrets.
CREATE TABLE IF NOT EXISTS crm_mirror_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN (
    'service_binding_unavailable',
    'secret_missing_or_short',
    'accepted',
    'rejected',
    'service_call_failed'
  )),
  http_status INTEGER
);
-- After a NEW staging form submission:
-- SELECT created_at, outcome, http_status FROM crm_mirror_diagnostics ORDER BY id DESC LIMIT 5;
