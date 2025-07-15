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
    password TEXT NOT NULL,
    type TEXT,
    is_validated INTEGER DEFAULT 0,  -- 0 = non validé, 1 = validé
    role TEXT DEFAULT 'membre',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS annonces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    depart TEXT NOT NULL,
    arrivee TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    remuneration REAL NOT NULL,
    image TEXT,
    statut TEXT DEFAULT 'ouverte',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS livraisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    annonce_id INTEGER NOT NULL,
    livreur_id INTEGER NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    code_validation TEXT,
    date_prise_en_charge DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_livraison DATETIME,
    FOREIGN KEY(annonce_id) REFERENCES annonces(id),
    FOREIGN KEY(livreur_id) REFERENCES users(id)
  )`);

});

module.exports = db;
