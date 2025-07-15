const db = require('./db');

const AnnonceModel = {
<<<<<<< HEAD
  // ✅ Création d’une annonce
  createAnnonce: (annonce, callback) => {
    const { user_id, titre, description, depart, arrivee, date, type, remuneration, image } = annonce;
    const now = new Date().toISOString();

=======
  createAnnonce: (annonce, callback) => {
    const { user_id, titre, description, depart, arrivee, date, type, remuneration, image } = annonce;
    const now = new Date().toISOString();
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, titre, description, depart, arrivee, date, type, remuneration, image, 'ouverte', now, now],
      function(err) { 
        if (err) return callback(err);
        db.get("SELECT * FROM annonces WHERE id = ?", [this.lastID], callback);
      }
    );
  },

<<<<<<< HEAD
  // ✅ Toutes les annonces par utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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

<<<<<<< HEAD
  // ✅ Toutes les annonces
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  getAllAnnonces: (callback) => {
    db.all(
      `SELECT a.*, u.name as user_name 
       FROM annonces a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC`,
      callback
    );
  },

<<<<<<< HEAD
  // ✅ Une annonce par ID
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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

<<<<<<< HEAD
  // ✅ Mise à jour
  updateAnnonce: (id, annonce, callback) => {
    const { titre, description, depart, arrivee, date, type, remuneration, image, statut } = annonce;
    const now = new Date().toISOString();

=======
  updateAnnonce: (id, annonce, callback) => {
    const { titre, description, depart, arrivee, date, type, remuneration, image, statut } = annonce;
    const now = new Date().toISOString();
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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

<<<<<<< HEAD
  // ✅ Suppression
  deleteAnnonce: (id, callback) => {
    db.run("DELETE FROM annonces WHERE id = ?", [id], callback);
  },

  // ✅ Annonces disponibles (pas encore prises en charge ou annulées)
  getAvailable: (callback) => {
    db.all(
      `SELECT a.*, u.name as user_name
       FROM annonces a
       LEFT JOIN livraisons l ON a.id = l.annonce_id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE l.id IS NULL OR l.statut = 'annulee'
       ORDER BY a.created_at DESC`,
      [],
      callback
    );
  }
};

module.exports = AnnonceModel;
=======
  deleteAnnonce: (id, callback) => {
    db.run("DELETE FROM annonces WHERE id = ?", [id], callback);
  }
};

module.exports = AnnonceModel; 
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
