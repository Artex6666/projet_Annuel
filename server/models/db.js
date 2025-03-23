const sqlite3 = require('sqlite3').verbose();
const { databaseUrl } = require('../config/config');

const db = new sqlite3.Database(databaseUrl, (err) => {
  if (err) {
    console.error("Erreur de connexion à SQLite :", err);
  } else {
    console.log("Connecté à SQLite.");
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    type TEXT,
    is_validated INTEGER DEFAULT 0,  -- 0 = non validé, 1 = validé
    role TEXT DEFAULT 'membre',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
