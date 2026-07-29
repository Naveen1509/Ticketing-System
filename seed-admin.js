const db = require("./database");

db.run(
  "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
  ["admin", "admin", "admin"],
  function (err) {
    if (err) {
      console.error("Error creating admin:", err.message);
      db.close();
      return;
    }

    if (this.changes === 0) {
      console.log("Admin user already exists");
    } else {
      console.log("Admin user created successfully");
    }

    db.close();
  }
);
