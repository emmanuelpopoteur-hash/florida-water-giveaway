"""Checks the PRIVATE CRM schema against local SQLite using fictional records only."""
from pathlib import Path
import sqlite3

schema = (Path(__file__).resolve().parents[1] / "schema.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript(schema)
tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"crm_leads", "crm_notes", "crm_audit"} <= tables, tables
indexes = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='index'")}
assert {"crm_leads_recent", "crm_leads_status", "crm_leads_followup", "crm_notes_lead", "crm_audit_lead"} <= indexes
id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
db.execute(
    "INSERT INTO crm_leads(id,created_at,updated_at,full_name,phone,zip,source) VALUES(?,?,?,?,?,?,?)",
    (id, "2026-10-29T19:00:00Z", "2026-10-29T19:00:00Z", "Cliente Ficticio", "4075550101", "34769", "manual"),
)
db.execute(
    "INSERT INTO crm_notes(id,lead_id,created_at,author,body) VALUES(?,?,?,?,?)",
    ("note-test", id, "2026-10-29T19:01:00Z", "test@example.invalid", "Demo only"),
)
assert db.execute("SELECT status FROM crm_leads WHERE id=?", (id,)).fetchone()[0] == "new"
try:
    db.execute("UPDATE crm_leads SET status='not_a_status' WHERE id=?", (id,))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Invalid status was accepted")
try:
    db.execute(
        "INSERT INTO crm_notes(id,lead_id,created_at,author,body) VALUES(?,?,?,?,?)",
        ("note-orphan", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "2026-10-29T19:02:00Z",
         "test@example.invalid", "No parent"),
    )
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Orphan note was accepted")
db.execute("DELETE FROM crm_leads WHERE id=?", (id,))
assert db.execute("SELECT COUNT(*) FROM crm_notes").fetchone()[0] == 0
print("CRM SQLite migration checks passed: schema, indexes, status constraint, foreign key, cascade.")
