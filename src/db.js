const Database = require("better-sqlite3");
const { DB } = require("./config");


const db = new Database(DB.path);


db.pragma("journal_mode = WAL");


db.prepare(`
CREATE TABLE IF NOT EXISTS sent_emails (
id INTEGER PRIMARY KEY AUTOINCREMENT,
to_email TEXT NOT NULL,
subject TEXT NOT NULL,
body TEXT NOT NULL,
intent TEXT NOT NULL,
role TEXT,
job_desc TEXT,
extra TEXT,
message_id TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
deleted BOOLEAN DEFAULT FALSE
);
`).run();

// Add deleted column if it doesn't exist (for existing databases)
try {
  db.prepare('ALTER TABLE sent_emails ADD COLUMN deleted BOOLEAN DEFAULT FALSE').run();
} catch (err) {
  // Column already exists, ignore error
}


const insertStmt = db.prepare(`
INSERT INTO sent_emails (to_email, subject, body, intent, role, job_desc, extra, message_id)
VALUES (@to, @subject, @body, @intent, @role, @jobDesc, @extra, @messageId)
`);


const recentByEmailStmt = db.prepare(`
SELECT * FROM sent_emails WHERE to_email = ? AND deleted = FALSE ORDER BY created_at DESC LIMIT 5
`);

const allRecentStmt = db.prepare(`
SELECT * FROM sent_emails WHERE deleted = FALSE ORDER BY created_at DESC LIMIT 20
`);

const softDeleteStmt = db.prepare(`
UPDATE sent_emails SET deleted = TRUE WHERE id = ?
`);


function logEmail(row) {
console.log(`[db] 💾 Logging email to database for ${row.to}`);
console.log(`[db] 📋 Details: intent=${row.intent}, role=${row.role}, messageId=${row.messageId}`);
const result = insertStmt.run(row);
console.log(`[db] ✅ Email logged with ID: ${result.lastInsertRowid}`);
return result;
}


function recentFor(email) {
console.log(`[db] 🔍 Checking recent emails for ${email}`);
const result = recentByEmailStmt.all(email);
console.log(`[db] 📊 Found ${result.length} recent emails for ${email}`);
return result;
}

function getAllRecent() {
console.log(`[db] 🔍 Fetching all recent emails`);
const result = allRecentStmt.all();
console.log(`[db] 📊 Found ${result.length} recent emails`);
return result;
}

function softDeleteEmail(id) {
console.log(`[db] 🗑️ Soft deleting email with ID: ${id}`);
const result = softDeleteStmt.run(id);
console.log(`[db] ✅ Email soft deleted, rows affected: ${result.changes}`);
return result;
}


module.exports = { db, logEmail, recentFor, getAllRecent, softDeleteEmail };