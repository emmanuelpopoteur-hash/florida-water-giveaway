CREATE TABLE IF NOT EXISTS water_test_leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  zip TEXT NOT NULL,
  preferred_day TEXT NOT NULL CHECK (preferred_day IN ('Weekday', 'Weekend')),
  preferred_time TEXT NOT NULL CHECK (preferred_time IN ('Morning', 'Afternoon', 'Evening')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT NOT NULL,
  campaign TEXT NOT NULL DEFAULT '',
  product_interest TEXT
);

CREATE INDEX IF NOT EXISTS idx_water_test_leads_created_at
  ON water_test_leads(created_at DESC);
