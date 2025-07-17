const db = require('./db');

const GeocodeCacheModel = {
  // Créer la table de cache si elle n'existe pas
  initTable: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS geocode_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT UNIQUE NOT NULL,
        result TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `);
    
    // Index pour les performances
    db.run(`CREATE INDEX IF NOT EXISTS idx_geocode_query ON geocode_cache(query)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_geocode_expires ON geocode_cache(expires_at)`);
  },

  // Nettoyer les entrées expirées
  cleanup: () => {
    db.run(`DELETE FROM geocode_cache WHERE expires_at < datetime('now')`);
  },

  // Récupérer depuis le cache
  get: (query, callback) => {
    db.get(
      `SELECT result FROM geocode_cache 
       WHERE query = ? AND expires_at > datetime('now')`,
      [query],
      (err, row) => {
        if (err) return callback(err);
        if (!row) return callback(null, null);
        
        try {
          const result = JSON.parse(row.result);
          callback(null, result);
        } catch (e) {
          callback(e);
        }
      }
    );
  },

  // Sauvegarder dans le cache (expire dans 24h)
  set: (query, result, callback) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    db.run(
      `INSERT OR REPLACE INTO geocode_cache (query, result, expires_at) 
       VALUES (?, ?, ?)`,
      [query, JSON.stringify(result), expiresAt.toISOString()],
      callback
    );
  },

  // Recherche partielle dans le cache
  searchPartial: (query, callback) => {
    const searchTerm = `%${query}%`;
    db.all(
      `SELECT result FROM geocode_cache 
       WHERE query LIKE ? AND expires_at > datetime('now')
       ORDER BY LENGTH(query) ASC
       LIMIT 10`,
      [searchTerm],
      (err, rows) => {
        if (err) return callback(err);
        if (!rows || rows.length === 0) return callback(null, []);
        
        try {
          // Fusionner tous les résultats trouvés
          const allResults = [];
          rows.forEach(row => {
            const result = JSON.parse(row.result);
            if (Array.isArray(result)) {
              allResults.push(...result);
            }
          });
          
          // Dédupliquer par display_name
          const uniqueResults = allResults.filter((item, index, self) => 
            index === self.findIndex(t => t.display_name === item.display_name)
          );
          
          callback(null, uniqueResults);
        } catch (e) {
          callback(e);
        }
      }
    );
  },

  // Statistiques du cache
  getStats: (callback) => {
    db.get(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN expires_at > datetime('now') THEN 1 END) as valid
       FROM geocode_cache`,
      callback
    );
  }
};

module.exports = GeocodeCacheModel; 