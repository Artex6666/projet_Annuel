const db = require('./db');

const AnnonceModel = {
  createAnnonce: (annonce, callback) => {
    const { user_id, titre, description, depart, arrivee, date, type, remuneration, image, livraison_partielle, current_location } = annonce;
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO annonces (
        user_id, 
        titre, 
        description, 
        depart, 
        arrivee, 
        date, 
        type, 
        remuneration, 
        image,
        statut,
        livraison_partielle,
        current_location,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, titre, description, depart, arrivee, date, type, remuneration, image, 'ouverte', livraison_partielle || 0, current_location || depart, now, now],
      function(err) { 
        if (err) return callback(err);
        db.get("SELECT * FROM annonces WHERE id = ?", [this.lastID], callback);
      }
    );
  },

  getAnnoncesByUser: (user_id, callback) => {
    db.all(
      `SELECT a.*, u.name as user_name 
       FROM annonces a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.user_id = ? 
       ORDER BY a.created_at DESC`,
      [user_id],
      callback
    );
  },

  getAllAnnonces: (callback) => {
    db.all(
      `SELECT a.*, u.name as user_name 
       FROM annonces a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC`,
      callback
    );
  },

  getAnnonceById: (id, callback) => {
    db.get(
      `SELECT a.*, u.name as user_name 
       FROM annonces a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id],
      callback
    );
  },

  updateAnnonce: (id, annonce, callback) => {
    const { titre, description, depart, arrivee, date, type, remuneration, image, statut } = annonce;
    const now = new Date().toISOString();
    db.run(
      `UPDATE annonces SET 
        titre = ?, 
        description = ?, 
        depart = ?, 
        arrivee = ?, 
        date = ?, 
        type = ?, 
        remuneration = ?, 
        image = ?, 
        statut = ?,
        updated_at = ?
       WHERE id = ?`,
      [titre, description, depart, arrivee, date, type, remuneration, image, statut, now, id],
      function(err) {
        if (err) return callback(err);
        AnnonceModel.getAnnonceById(id, callback);
      }
    );
  },

  deleteAnnonce: (id, callback) => {
    db.run("DELETE FROM annonces WHERE id = ?", [id], callback);
  },

  // Retourner les annonces disponibles (statut = 'ouverte')
  getAnnoncesDisponibles: (callback) => {
    db.all(
      `SELECT a.*, u.name as user_name 
       FROM annonces a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.statut = 'ouverte' 
       ORDER BY a.created_at DESC`,
      callback
    );
  }
};

module.exports = AnnonceModel; 