const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("./database");

const app = express();
const MAX_IMAGE_DATA_LENGTH = 2_500_000;

function logComplaintHistory({ ticketId, action, actorRole, actorName, details }) {
  db.run(
    `INSERT INTO complaint_history (ticket_id, action, actor_role, actor_name, details, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ticketId || null,
      action,
      actorRole || "system",
      actorName || "system",
      JSON.stringify(details || {}),
      new Date().toISOString(),
    ]
  );
}

function toIsoOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeTicketStatus(value) {
  const key = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  const map = {
    none: "None",
    open: "Open",
    "in progress": "In Progress",
    inprogress: "In Progress",
    "in process": "In Progress",
    inprocess: "In Progress",
    closed: "Closed",
    "re-open": "Re-Open",
    reopen: "Re-Open",
  };
  return map[key] || null;
}

function normalizeAccessRole(value) {
  const key = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  const map = {
    admin: "admin",
    user: "user",
    employee: "employee",
    employees: "employee",
    supervisor: "supervisor",
    supervisors: "supervisor",
    superwiser: "supervisor",
    superwisers: "supervisor",
    "team lead": "team lead",
    teamlead: "team lead",
  };
  return map[key] || null;
}

function normalizeImageData(value) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  if (!text.startsWith("data:image/")) return null;
  if (text.length > MAX_IMAGE_DATA_LENGTH) return null;
  return text;
}

function generateRandomComplaintNo() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function createUniqueComplaintNo(done, attempts = 0) {
  if (attempts > 30) {
    return done(new Error("Unable to allocate complaint number"));
  }
  const candidate = generateRandomComplaintNo();
  db.get("SELECT id FROM tickets WHERE complaintNo = ? LIMIT 1", [candidate], (err, row) => {
    if (err) return done(err);
    if (row) return createUniqueComplaintNo(done, attempts + 1);
    done(null, candidate);
  });
}

app.use(express.json());
const staticDir = fs.existsSync(path.join(__dirname, "Public"))
  ? path.join(__dirname, "Public")
  : path.join(__dirname, "public");

app.use(express.static(staticDir));
app.get(["/", "/login"], (req, res) => {
  res.sendFile(path.join(staticDir, "login.html"));
});
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(staticDir, "admin-login.html"));
});
app.get("/user-login", (req, res) => {
  res.sendFile(path.join(staticDir, "user-login.html"));
});

/* =====================
   🔐 LOGIN
===================== */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      res.json(user);
    }
  );
});

/* =====================
   👤 CREATE USER (ADMIN)
===================== */
app.post("/admin/create-user", (req, res) => {
  const { username, password, role, userRole } = req.body;

  if (normalizeAccessRole(role) !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const cleanUserRole = normalizeAccessRole(userRole) || "employee";

  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [cleanUsername, cleanPassword, cleanUserRole],
    function (err) {
      if (err) {
        if (String(err.message || "").includes("UNIQUE")) {
          return res.status(409).json({ error: "Username already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        id: this.lastID,
        username: cleanUsername,
        role: cleanUserRole,
      });
    }
  );
});

/* Ensure admin exists */
db.run(
  "INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin', 'admin')"
);

/* =====================
   🎫 CREATE TICKET
===================== */
app.post("/tickets", (req, res) => {
  const { title, description, department, user_id, imageData } = req.body;
  const allowedDepartments = new Set([
    "Roto",
    "Paint",
    "Comp",
    "MM",
    "CG",
    "Lighting",
    "Moduling",
    "Co-Ordinators",
    "Producers",
    "IO",
    "AI",
    "Business development",
    "HR",
    "Accounts",
    "Others",
  ]);
  const safeDepartment = String(department || "").trim();

  if (!title || !description || !safeDepartment || !user_id) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!allowedDepartments.has(safeDepartment)) {
    return res.status(400).json({ error: "Invalid department" });
  }

  const cleanedImageData = normalizeImageData(imageData);
  if (imageData && !cleanedImageData) {
    return res.status(400).json({ error: "Invalid image. Use an image under 2 MB." });
  }

  const createdAt = new Date().toISOString();

  createUniqueComplaintNo((noErr, complaintNo) => {
    if (noErr) return res.status(500).json({ error: noErr.message });

    db.run(
      `INSERT INTO tickets (complaintNo, title, description, department, imageData, status, user_id, createdAt, openedAt, closedAt, totalOpenSeconds)
       VALUES (?, ?, ?, ?, ?, 'None', ?, ?, NULL, NULL, 0)`,
      [complaintNo, title, description, safeDepartment, cleanedImageData, user_id, createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const ticketId = this.lastID;
        logComplaintHistory({
          ticketId,
          action: "CREATED",
          actorRole: "user",
          actorName: `user-${user_id}`,
          details: {
            complaintNo,
            title,
            description,
            department: safeDepartment,
            user_id,
            status: "None",
            createdAt,
            hasImage: Boolean(cleanedImageData),
          },
        });
        res.json({ success: true, id: ticketId, complaintNo });
      }
    );
  });
});

/* =====================
   🎫 GET TICKETS
===================== */
app.get("/tickets", (req, res) => {
  const { role, userId } = req.query;

  let sql;
  let params = [];

  if (role === "admin") {
    sql = `
      SELECT tickets.*, users.username AS username
      FROM tickets
      LEFT JOIN users ON users.id = tickets.user_id
      ORDER BY tickets.id DESC
    `;
  } else {
    if (!userId) {
      return res.status(400).json({ error: "userId is required for non-admin requests" });
    }
    sql = "SELECT * FROM tickets WHERE user_id = ? ORDER BY id DESC";
    params = [userId];
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

/* =====================
   📊 ADMIN STATS
===================== */
app.get("/admin/stats", (req, res) => {
  if (req.query.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const stats = {};

  db.get("SELECT COUNT(*) total FROM tickets", (e, r) => {
    if (e || !r) return res.status(500).json({ error: "Unable to load total count" });
    stats.total = r.total;

    db.get("SELECT COUNT(*) open FROM tickets WHERE status IN ('Open', 'Re-Open')", (e, r) => {
      if (e || !r) return res.status(500).json({ error: "Unable to load open count" });
      stats.open = r.open;

      db.get("SELECT COUNT(*) progress FROM tickets WHERE status='In Progress'", (e, r) => {
        if (e || !r) return res.status(500).json({ error: "Unable to load progress count" });
        stats.progress = r.progress;

        db.get("SELECT COUNT(*) closed FROM tickets WHERE status='Closed'", (e, r) => {
          if (e || !r) return res.status(500).json({ error: "Unable to load closed count" });
          stats.closed = r.closed;
          res.json(stats);
        });
      });
    });
  });
});

/* =====================
   📝 UPDATE STATUS + COMMENT (ADMIN)
===================== */
app.put("/tickets/:id/admin-update", (req, res) => {
  const { status, comment, role } = req.body;
  const { id } = req.params;

  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.get("SELECT status, comment, createdAt, openedAt, closedAt, totalOpenSeconds FROM tickets WHERE id = ?", [id], (getErr, oldTicket) => {
    if (getErr) return res.status(500).json({ error: getErr.message });
    if (!oldTicket) return res.status(404).json({ error: "Ticket not found" });

    const incomingStatus = normalizeTicketStatus(status);
    const currentStatus = normalizeTicketStatus(oldTicket.status);
    const effectiveStatus = incomingStatus || currentStatus || "None";
    const previousStatus = currentStatus || "None";

    const now = new Date();
    const nowIso = now.toISOString();

    let nextOpenedAt = oldTicket.openedAt || null;
    let nextClosedAt = oldTicket.closedAt || null;
    let nextTotalOpenSeconds = Number(oldTicket.totalOpenSeconds || 0);

    const isOpenLike =
      effectiveStatus === "Open" ||
      effectiveStatus === "In Progress" ||
      effectiveStatus === "Re-Open";

    // Start (or restart) running timer when entering an open-like state.
    if (isOpenLike) {
      if (!nextOpenedAt || previousStatus === "Closed" || previousStatus === "None") {
        nextOpenedAt = nowIso;
      }
      nextClosedAt = null;
    }

    // Stop running timer when closing.
    if (effectiveStatus === "Closed") {
      if (nextOpenedAt) {
        const startMs = new Date(nextOpenedAt).getTime();
        if (!Number.isNaN(startMs)) {
          const deltaSeconds = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
          nextTotalOpenSeconds += deltaSeconds;
        }
      }
      nextOpenedAt = null;
      nextClosedAt = nowIso;
    }

    if (effectiveStatus === "None") {
      nextOpenedAt = null;
      nextClosedAt = null;
      nextTotalOpenSeconds = 0;
    }

    db.run(
      "UPDATE tickets SET status = ?, comment = ?, openedAt = ?, closedAt = ?, totalOpenSeconds = ? WHERE id = ?",
      [effectiveStatus, comment, nextOpenedAt, nextClosedAt, nextTotalOpenSeconds, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        logComplaintHistory({
          ticketId: Number(id),
          action: "UPDATED",
          actorRole: "admin",
          actorName: "admin",
          details: {
            before: { status: oldTicket.status, comment: oldTicket.comment || "" },
            after: {
              status: effectiveStatus,
              comment: comment || "",
              openedAt: nextOpenedAt,
              closedAt: nextClosedAt,
              totalOpenSeconds: nextTotalOpenSeconds,
            },
          },
        });

        res.json({ success: true });
      }
    );
  });
});

app.put("/tickets/:id/reopen", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body || {};
  const safeUserId = Number(userId);

  if (!Number.isFinite(safeUserId) || safeUserId <= 0) {
    return res.status(400).json({ error: "Valid userId is required" });
  }

  db.get("SELECT * FROM tickets WHERE id = ? AND user_id = ?", [id, safeUserId], (getErr, ticket) => {
    if (getErr) return res.status(500).json({ error: getErr.message });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.status !== "Closed") {
      return res.status(400).json({ error: "Only closed tickets can be re-opened" });
    }

    const nowIso = new Date().toISOString();
    db.run(
      "UPDATE tickets SET status = 'Re-Open', openedAt = ?, closedAt = NULL WHERE id = ?",
      [nowIso, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        logComplaintHistory({
          ticketId: Number(id),
          action: "REOPENED",
          actorRole: "user",
          actorName: `user-${safeUserId}`,
          details: { reopenedAt: nowIso, previousStatus: ticket.status },
        });

        res.json({ success: true });
      }
    );
  });
});

/* =====================
   🗑 DELETE TICKET (ADMIN)
===================== */
app.delete("/tickets/:id", (req, res) => {
  const { role } = req.query;
  const { id } = req.params;

  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.get("SELECT * FROM tickets WHERE id = ?", [id], (getErr, ticket) => {
    if (getErr) return res.status(500).json({ error: getErr.message });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    db.run("DELETE FROM tickets WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      logComplaintHistory({
        ticketId: Number(id),
        action: "DELETED",
        actorRole: "admin",
        actorName: "admin",
        details: {
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          comment: ticket.comment || "",
          user_id: ticket.user_id,
        },
      });

      res.json({ success: true });
    });
  });
});

/* =====================
   🕘 ADMIN HISTORY
===================== */
app.get("/admin/history", (req, res) => {
  const { role, limit } = req.query;
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  db.all(
    `SELECT id, ticket_id, action, actor_role, actor_name, details, createdAt
     FROM complaint_history
     ORDER BY id DESC
     LIMIT ?`,
    [safeLimit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const parsedRows = (rows || []).map((row) => {
        let details = {};
        try {
          details = JSON.parse(row.details || "{}");
        } catch (_) {}
        return { ...row, details };
      });
      res.json(parsedRows);
    }
  );
});

app.post("/admin/history/backup", (req, res) => {
  const { role, backupDir } = req.body || {};
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.all(
    `SELECT id, ticket_id, action, actor_role, actor_name, details, createdAt
     FROM complaint_history
     ORDER BY id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const parsedRows = (rows || []).map((row) => {
        let details = {};
        try {
          details = JSON.parse(row.details || "{}");
        } catch (_) {}
        return { ...row, details };
      });

      const requestedDir = String(backupDir || "").trim();
      const targetDir = requestedDir
        ? path.resolve(requestedDir)
        : path.join(__dirname, "backups");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `complaint-history-${stamp}.json`;
      const filePath = path.join(targetDir, filename);
      const payload = {
        generatedAt: new Date().toISOString(),
        total: parsedRows.length,
        records: parsedRows,
      };

      try {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
      } catch (writeErr) {
        return res.status(500).json({ error: String(writeErr.message || writeErr) });
      }

      res.json({
        success: true,
        filename,
        path: filePath,
        backupDir: targetDir,
        total: parsedRows.length,
      });
    }
  );
});

app.delete("/admin/history", (req, res) => {
  const { role } = req.body || {};
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.run("DELETE FROM complaint_history", function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes || 0 });
  });
});

/* =====================
   🗄 ADMIN STORAGE
===================== */
app.get("/admin/storage", (req, res) => {
  const { role } = req.query;
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const dbPath = db.dbPath || path.join(__dirname, "tickets.db");
  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(dbPath).size;
  } catch (_) {}

  db.get("SELECT COUNT(*) totalTickets FROM tickets", (e1, t1) => {
    if (e1 || !t1) return res.status(500).json({ error: "Failed to load ticket storage" });

    db.get("SELECT COUNT(*) totalHistory FROM complaint_history", (e2, t2) => {
      if (e2 || !t2) return res.status(500).json({ error: "Failed to load history storage" });

      db.get(
        "SELECT MIN(createdAt) oldestHistory, MAX(createdAt) latestHistory FROM complaint_history",
        (e3, t3) => {
          if (e3 || !t3) return res.status(500).json({ error: "Failed to load storage dates" });

          res.json({
            dbSizeBytes,
            totalTickets: t1.totalTickets || 0,
            totalHistory: t2.totalHistory || 0,
            oldestHistory: t3.oldestHistory || null,
            latestHistory: t3.latestHistory || null,
          });
        }
      );
    });
  });
});

/* =====================
   🚀 START SERVER
===================== */
/* =====================
   CHAT API
===================== */
app.get("/chat/users", (req, res) => {
  const role = String(req.query.role || "").trim().toLowerCase();
  const adminId = Number(req.query.adminId || req.query.userId || 0);
  if (role !== "admin" || !Number.isFinite(adminId) || adminId <= 0) {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.all("SELECT id, username, role FROM users WHERE role <> 'admin' ORDER BY username COLLATE NOCASE ASC", (err, users) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(
      `SELECT sender_id AS userId, COUNT(*) AS unreadCount
       FROM chat_messages
       WHERE receiver_role = 'admin' AND receiver_id = ? AND read_by_admin = 0
       GROUP BY sender_id`,
      [adminId],
      (unreadErr, unreadRows) => {
        if (unreadErr) return res.status(500).json({ error: unreadErr.message });

        db.all(
          `SELECT cm.sender_id AS userId, cm.message AS lastMessage, cm.createdAt AS lastMessageAt
           FROM chat_messages cm
           INNER JOIN (
             SELECT sender_id, MAX(id) AS maxId
             FROM chat_messages
             WHERE receiver_role = 'admin' AND receiver_id = ?
             GROUP BY sender_id
           ) latest ON latest.sender_id = cm.sender_id AND latest.maxId = cm.id`,
          [adminId],
          (lastErr, lastRows) => {
            if (lastErr) return res.status(500).json({ error: lastErr.message });

            const unreadMap = new Map((unreadRows || []).map((r) => [Number(r.userId), Number(r.unreadCount || 0)]));
            const lastMap = new Map((lastRows || []).map((r) => [Number(r.userId), r]));

            const response = (users || []).map((u) => {
              const userId = Number(u.id);
              const last = lastMap.get(userId);
              return {
                id: userId,
                username: u.username,
                role: u.role,
                unreadCount: unreadMap.get(userId) || 0,
                lastMessage: last ? last.lastMessage : "",
                lastMessageAt: last ? last.lastMessageAt : null,
              };
            });

            res.json(response);
          }
        );
      }
    );
  });
});

app.get("/chat/messages", (req, res) => {
  const role = String(req.query.role || "").trim().toLowerCase();
  const userId = Number(req.query.userId || 0);

  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: "Valid userId is required" });
  }

  if (role === "admin") {
    const withUserId = Number(req.query.withUserId || 0);
    if (!Number.isFinite(withUserId) || withUserId <= 0) {
      return res.status(400).json({ error: "withUserId is required for admin chat" });
    }

    db.all(
      `SELECT id, sender_id, sender_role, receiver_id, receiver_role, message, createdAt
       FROM chat_messages
       WHERE (sender_id = ? AND receiver_role = 'admin' AND receiver_id = ?)
          OR (sender_role = 'admin' AND sender_id = ? AND receiver_role = 'user' AND receiver_id = ?)
       ORDER BY id ASC`,
      [withUserId, userId, userId, withUserId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run(
          `UPDATE chat_messages
           SET read_by_admin = 1
           WHERE sender_id = ? AND receiver_role = 'admin' AND receiver_id = ? AND read_by_admin = 0`,
          [withUserId, userId],
          () => res.json(rows || [])
        );
      }
    );
    return;
  }

  db.all(
    `SELECT id, sender_id, sender_role, receiver_id, receiver_role, message, createdAt
     FROM chat_messages
     WHERE (sender_id = ? AND receiver_role = 'admin')
        OR (receiver_role = 'user' AND receiver_id = ?)
     ORDER BY id ASC`,
    [userId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        `UPDATE chat_messages
         SET read_by_user = 1
         WHERE receiver_role = 'user' AND receiver_id = ? AND read_by_user = 0`,
        [userId],
        () => res.json(rows || [])
      );
    }
  );
});

app.post("/chat/messages", (req, res) => {
  const role = String(req.body.role || "").trim().toLowerCase();
  const message = String(req.body.message || "").trim();
  const nowIso = new Date().toISOString();

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: "Message is too long" });
  }

  if (role === "admin") {
    const adminId = Number(req.body.adminId || req.body.userId || 0);
    const toUserId = Number(req.body.toUserId || 0);
    if (!Number.isFinite(adminId) || adminId <= 0 || !Number.isFinite(toUserId) || toUserId <= 0) {
      return res.status(400).json({ error: "Valid adminId and toUserId are required" });
    }

    db.run(
      `INSERT INTO chat_messages
       (sender_id, sender_role, receiver_id, receiver_role, message, createdAt, read_by_admin, read_by_user)
       VALUES (?, 'admin', ?, 'user', ?, ?, 1, 0)`,
      [adminId, toUserId, message, nowIso],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          id: this.lastID,
          sender_id: adminId,
          sender_role: "admin",
          receiver_id: toUserId,
          receiver_role: "user",
          message,
          createdAt: nowIso,
        });
      }
    );
    return;
  }

  const senderUserId = Number(req.body.userId || 0);
  if (!Number.isFinite(senderUserId) || senderUserId <= 0) {
    return res.status(400).json({ error: "Valid userId is required" });
  }

  db.get("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1", (adminErr, adminRow) => {
    if (adminErr) return res.status(500).json({ error: adminErr.message });
    if (!adminRow) return res.status(500).json({ error: "No admin user found" });

    const adminId = Number(adminRow.id);
    db.run(
      `INSERT INTO chat_messages
       (sender_id, sender_role, receiver_id, receiver_role, message, createdAt, read_by_admin, read_by_user)
       VALUES (?, 'user', ?, 'admin', ?, ?, 0, 1)`,
      [senderUserId, adminId, message, nowIso],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          id: this.lastID,
          sender_id: senderUserId,
          sender_role: "user",
          receiver_id: adminId,
          receiver_role: "admin",
          message,
          createdAt: nowIso,
        });
      }
    );
  });
});

app.get("/chat/unread-count", (req, res) => {
  const role = String(req.query.role || "").trim().toLowerCase();
  const userId = Number(req.query.userId || 0);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: "Valid userId is required" });
  }

  if (role === "admin") {
    db.get(
      `SELECT COUNT(*) AS unread
       FROM chat_messages
       WHERE receiver_role = 'admin' AND receiver_id = ? AND read_by_admin = 0`,
      [userId],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ unread: Number((row && row.unread) || 0) });
      }
    );
    return;
  }

  db.get(
    `SELECT COUNT(*) AS unread
     FROM chat_messages
     WHERE receiver_role = 'user' AND receiver_id = ? AND read_by_user = 0`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ unread: Number((row && row.unread) || 0) });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
