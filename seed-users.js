const db = require("./database");

db.serialize(() => {
  db.run(
    "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["admin", "admin", "admin"]
  );

  db.run(
    "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
    ["user", "user123", "user"],
    function (err) {
      if (err) {
        console.error("Error seeding users:", err.message);
      } else {
        console.log("Seed users completed");
      }
      db.close();
    }
  );
});
