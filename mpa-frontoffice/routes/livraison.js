const db = require('./db');

const LivraisonModel = {
  // ✅ Créer une nouvelle livraison (prise en charge)
  create: (annonce_id, livreur_id, callback) => {
    db.get(`SELECT * FROM livraisons WHERE annonce_id = ?`, [annonce_id], (err, existing) => {
      if (err) return callback(err);
      if (existing) return callback({ error: 'Cette annonce est déjà prise en charge.' });

      db.run(
        `INSERT INTO livraisons (annonce_id, livreur_id, statut, date_prise_en_charge)
         VALUES (?, ?, 'en_attente', datetime('now'))`,
        [annonce_id, livreur_id],
        function (err) {
          if (err) return callback(err);

          const livraisonId = this.lastID;

          db.run(
            `UPDATE annonces SET statut = 'prise_en_charge' WHERE id = ?`,
            [annonce_id],
            (updateErr) => {
              if (updateErr) return callback(updateErr);
              callback(null, livraisonId);
            }
          );
        }
      );
    });
  },

  // ✅ Trouver une livraison par ID d'annonce
  findByAnnonceId: (annonce_id, callback) => {
    db.get(`SELECT * FROM livraisons WHERE annonce_id = ?`, [annonce_id], callback);
  },

  // ✅ Trouver les livraisons d’un livreur (avec infos d'annonce)
  findByLivreurId: (livreur_id, callback) => {
    db.all(
      `SELECT l.*, a.titre, a.depart, a.arrivee, a.date, a.type, a.remuneration
       FROM livraisons l
       JOIN annonces a ON l.annonce_id = a.id
       WHERE l.livreur_id = ?`,
      [livreur_id],
      callback
    );
  },

  // ✅ Marquer une livraison comme livrée
  markAsDelivered: (livraison_id, callback) => {
    db.run(
      `UPDATE livraisons SET statut = 'livree', date_livraison = datetime('now') WHERE id = ?`,
      [livraison_id],
      callback
    );
  },

  // ✅ Mettre à jour statut et livreur si possible
  updateStatutEtLivreur: (id, statut, livreur_id, callback) => {
    const query = livreur_id !== null
      ? `UPDATE livraisons SET statut = ?, livreur_id = ? WHERE id = ?`
      : `UPDATE livraisons SET statut = ? WHERE id = ?`;

    const params = livreur_id !== null
      ? [statut, livreur_id, id]
      : [statut, id];

    db.run(query, params, callback);
  },

  // ✅ Mettre à jour uniquement le statut
  updateStatut: (id, statut, callback) => {
    const query = `UPDATE livraisons SET statut = ? WHERE id = ?`;
    db.run(query, [statut, id], callback);
  }
};

module.exports = LivraisonModel;
