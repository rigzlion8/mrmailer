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
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`).run();


const insertStmt = db.prepare(`
INSERT INTO sent_emails (to_email, subject, body, intent, role, job_desc, extra, message_id)
VALUES (@to, @subject, @body, @intent, @role, @jobDesc, @extra, @messageId)
`);


const recentByEmailStmt = db.prepare(`
SELECT * FROM sent_emails WHERE to_email = ? ORDER BY created_at DESC LIMIT 5
`);


function logEmail(row) {
return insertStmt.run(row);
}


function recentFor(email) {
return recentByEmailStmt.all(email);
}


module.exports = { db, logEmail, recentFor };