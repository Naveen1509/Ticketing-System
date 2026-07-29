const sqlite3 = require("sqlite3").verbose();
const path = require("path");

let dbPath;
if (process.versions.electron) {
  try {
    const { app } = require("electron");
    dbPath = path.join(app.getPath("userData"), "tickets.db");
  } catch (e) {
    dbPath = path.join(__dirname, "tickets.db");
  }
} else {
  dbPath = path.join(__dirname, "tickets.db");
}

function randomFiveDigit() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB connection error:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create tables first to avoid startup errors on first run.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaintNo TEXT UNIQUE,
      title TEXT,
      department TEXT,
      description TEXT,
      imageData TEXT,
      status TEXT DEFAULT 'Open',
      comment TEXT,
      user_id INTEGER,
      assigned_to TEXT,
      createdAt TEXT,
      openedAt TEXT,
      closedAt TEXT,
      totalOpenSeconds INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS complaint_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      action TEXT,
      actor_role TEXT,
      actor_name TEXT,
      details TEXT,
      createdAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      receiver_id INTEGER NOT NULL,
      receiver_role TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      read_by_admin INTEGER DEFAULT 0,
      read_by_user INTEGER DEFAULT 0
    )
  `);

  // Backfill columns for older databases created before these fields existed.
  db.all("PRAGMA table_info(tickets)", (err, rows) => {
    if (err || !rows) return;

    const columns = new Set(rows.map((r) => r.name));

    if (!columns.has("comment")) {
      db.run("ALTER TABLE tickets ADD COLUMN comment TEXT");
    }

    if (!columns.has("createdAt")) {
      db.run("ALTER TABLE tickets ADD COLUMN createdAt TEXT");
    }

    if (!columns.has("openedAt")) {
      db.run("ALTER TABLE tickets ADD COLUMN openedAt TEXT");
    }

    if (!columns.has("closedAt")) {
      db.run("ALTER TABLE tickets ADD COLUMN closedAt TEXT");
    }

    if (!columns.has("totalOpenSeconds")) {
      db.run("ALTER TABLE tickets ADD COLUMN totalOpenSeconds INTEGER DEFAULT 0");
    }

    if (!columns.has("imageData")) {
      db.run("ALTER TABLE tickets ADD COLUMN imageData TEXT");
    }

    if (!columns.has("complaintNo")) {
      db.run("ALTER TABLE tickets ADD COLUMN complaintNo TEXT");
    }

    if (!columns.has("department")) {
      db.run("ALTER TABLE tickets ADD COLUMN department TEXT");
    }

    db.all("SELECT id, complaintNo FROM tickets ORDER BY id ASC", (scanErr, ticketRows) => {
      if (scanErr || !ticketRows) return;

      const used = new Set();
      const updates = [];

      ticketRows.forEach((row) => {
        const id = Number(row.id || 0);
        const current = String(row.complaintNo || "").trim();
        const isFiveDigit = /^\d{5}$/.test(current);
        const legacySequential = current === String(id).padStart(5, "0");

        // Keep existing non-sequential 5-digit numbers.
        if (isFiveDigit && !legacySequential && !used.has(current)) {
          used.add(current);
          return;
        }
        updates.push(id);
      });

      const assignNext = (index) => {
        if (index >= updates.length) return;
        let nextNo = randomFiveDigit();
        while (used.has(nextNo)) {
          nextNo = randomFiveDigit();
        }
        used.add(nextNo);
        const ticketId = updates[index];
        db.run("UPDATE tickets SET complaintNo = ? WHERE id = ?", [nextNo, ticketId], () => {
          assignNext(index + 1);
        });
      };

      assignNext(0);
    });

    // Normalize legacy status text variants.
    db.run(
      `UPDATE tickets
       SET status = 'In Progress'
       WHERE lower(trim(status)) IN ('in process', 'inprocess')`
    );

    // Backfill missing open time for old open-like tickets so duration can run.
    db.run(
      `UPDATE tickets
       SET openedAt = createdAt
       WHERE openedAt IS NULL
         AND createdAt IS NOT NULL
         AND status IN ('Open', 'In Progress', 'Re-Open')`
    );
  });
});

db.dbPath = dbPath;
module.exports = db;
