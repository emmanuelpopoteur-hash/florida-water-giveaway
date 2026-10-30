-- Separate PRIVATE Cloudflare D1 database. Do NOT run on legacy-water-leads.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS crm_leads (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 full_name TEXT NOT NULL,
 phone TEXT NOT NULL DEFAULT '',
 zip TEXT NOT NULL DEFAULT '',
 source TEXT NOT NULL,
 campaign TEXT NOT NULL DEFAULT '',
 product_interest TEXT,
 preferred_day TEXT NOT NULL DEFAULT '',
 preferred_time TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','proposal','scheduled','won','lost')),
 next_followup_date TEXT,
 assigned_to TEXT NOT NULL DEFAULT '',
 estimated_value_cents INTEGER,
 closed_value_cents INTEGER,
 updated_by TEXT NOT NULL DEFAULT 'import'
);
CREATE INDEX IF NOT EXISTS crm_leads_recent ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS crm_leads_status ON crm_leads(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS crm_leads_followup ON crm_leads(next_followup_date);
CREATE TABLE IF NOT EXISTS crm_notes(
 id TEXT PRIMARY KEY,
 lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL,
 author TEXT NOT NULL,
 body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS crm_notes_lead ON crm_notes(lead_id,created_at DESC);
CREATE TABLE IF NOT EXISTS crm_audit (
 id TEXT PRIMARY KEY,
 lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL,
 actor TEXT NOT NULL,
 action TEXT NOT NULL,
 summary TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS crm_audit_lead ON crm_audit(lead_id,created_at DESC);
