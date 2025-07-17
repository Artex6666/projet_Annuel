const db = require('./db');

const LivraisonModel = {
  // Créer une nouvelle livraison avec trajet personnalisé (version simplifiée)
  createWithRoute: (annonce_id, livreur_id, routeData, remuneration_calculated, callback) => {
    const { depart_livraison, arrivee_livraison, depart_lat, depart_lng, arrivee_lat, arrivee_lng, progress_percentage } = routeData;
    
    // Insérer la nouvelle livraison
    db.run(
      `INSERT INTO livraisons (
        annonce_id, livreur_id, statut, depart_livraison, arrivee_livraison,
        depart_lat, depart_lng, arrivee_lat, arrivee_lng, progress_percentage,
        remuneration_calculated, date_prise_en_charge
      ) VALUES (?, ?, 'en_attente', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [annonce_id, livreur_id, depart_livraison, arrivee_livraison, 
       depart_lat, depart_lng, arrivee_lat, arrivee_lng, progress_percentage, remuneration_calculated],
      function (err) {
        if (err) return callback(err);

        const livraisonId = this.lastID;

        // Mettre à jour le statut de l'annonce
        db.run(
          `UPDATE annonces SET statut = 'prise_en_charge', current_location = ? WHERE id = ?`,
          [depart_livraison, annonce_id],
          (updateErr) => {
            if (updateErr) return callback(updateErr);
            callback(null, livraisonId);
          }
        );
      }
    );
  },

  // Ancienne méthode pour compatibilité
  create: (annonce_id, livreur_id, callback) => {
    // Récupérer l'annonce pour utiliser ses adresses par défaut
    db.get(`SELECT * FROM annonces WHERE id = ?`, [annonce_id], (err, annonce) => {
      if (err) return callback(err);
      if (!annonce) return callback({ error: 'Annonce non trouvée' });

      LivraisonModel.createWithRoute(annonce_id, livreur_id, {
        depart_livraison: annonce.depart,
        arrivee_livraison: annonce.arrivee,
        depart_lat: annonce.depart_lat,
        depart_lng: annonce.depart_lng,
        arrivee_lat: annonce.arrivee_lat,
        arrivee_lng: annonce.arrivee_lng,
        progress_percentage: 100
      }, annonce.remuneration, callback);
    });
  },

  // Rechercher une livraison par annonce
  findByAnnonceId: (annonce_id, callback) => {
    db.get(`SELECT * FROM livraisons WHERE annonce_id = ?`, [annonce_id], callback);
  },

  // Récupérer les livraisons d'un livreur
  findByLivreurId: (livreur_id, callback) => {
    db.all(
      `SELECT l.*, a.titre, a.depart, a.arrivee, a.date, a.type, a.remuneration, a.livraison_partielle
       FROM livraisons l
       JOIN annonces a ON l.annonce_id = a.id
       WHERE l.livreur_id = ?
       ORDER BY l.date_prise_en_charge DESC`,
      [livreur_id],
      (err, livraisons) => {
        if (err) return callback(err);
        
        // Pour chaque livraison, calculer la rémunération réelle si elle n'est pas déjà calculée
        const livraisonsWithRemuneration = livraisons.map(livraison => {
          // Si la rémunération n'est pas encore calculée, utiliser la rémunération de l'annonce * progression
          if (!livraison.remuneration_calculated || livraison.remuneration_calculated === 0) {
            livraison.remuneration_calculated = (livraison.remuneration * livraison.progress_percentage / 100);
          }
          return livraison;
        });
        
        callback(null, livraisonsWithRemuneration);
      }
    );
  },

  // Trouver une livraison par ID
  findById: (id, callback) => {
    db.get(`SELECT * FROM livraisons WHERE id = ?`, [id], callback);
  },

  // Marquer une livraison comme livrée
  markAsDelivered: (livraison_id, callback) => {
    // Récupérer la livraison pour vérifier si elle est partielle
    db.get(`SELECT l.*, a.* FROM livraisons l 
            JOIN annonces a ON l.annonce_id = a.id 
            WHERE l.id = ?`, [livraison_id], (err, livraison) => {
      if (err) return callback(err);
      if (!livraison) return callback({ error: 'Livraison non trouvée' });

      // Marquer la livraison comme terminée
      db.run(
        `UPDATE livraisons SET statut = 'livree', date_livraison = datetime('now') WHERE id = ?`,
        [livraison_id],
        (err) => {
          if (err) return callback(err);

          // Vérifier si cestune livraison partielle
          const isPartialDelivery = livraison.arrivee_livraison !== livraison.arrivee;
          const allowsPartial = livraison.livraison_partielle === 1;
          
          if (isPartialDelivery && allowsPartial) {
            // Livraison partielle : mettre à jour l'annonce avec le nouveau point de départ
            db.run(
              `UPDATE annonces SET 
                statut = 'ouverte', 
                current_location = ?,
                depart = ?,
                updated_at = datetime('now')
               WHERE id = ?`,
              [livraison.arrivee_livraison, livraison.arrivee_livraison, livraison.annonce_id],
              (updateErr) => {
                if (updateErr) return callback(updateErr);
                callback(null, { message: 'Livraison partielle terminée. L\'annonce est maintenant disponible pour la suite du trajet.' });
              }
            );
          } else {
            // Livraison complète : marquer lannonce comme livrée
            db.run(
              `UPDATE annonces SET statut = 'livree' WHERE id = ?`,
              [livraison.annonce_id],
              (updateErr) => {
                if (updateErr) return callback(updateErr);
                callback(null, { message: 'Livraison complète terminée.' });
              }
            );
          }
        }
      );
    });
  }
}

// Fonction utilitaire pour calculer le pourcentage de progression
function calculateProgress(annonce, routeData) {
  // Si l'annonce napas de coordonnées stockées, on ne peut pas calculer précisément
  // On utilise une estimation basée sur les adresses
  if (!annonce.depart_lat || !annonce.depart_lng || !annonce.arrivee_lat || !annonce.arrivee_lng) {
    // Estimation basée sur la distance de la livraison par rapport au trajet total
    // Pour une livraison partielle, on estime entre 20% et 80%
    const deliveryDistance = getDistance(
      routeData.depart_lat, routeData.depart_lng,
      routeData.arrivee_lat, routeData.arrivee_lng
    );
    
    // Si la livraison fait plus de 100km, c'est probablement une livraison complète
    if (deliveryDistance > 100) {
      return 100;
    }
    
    // Sinon, estimation basée sur la distance
    const totalDistance = getDistance(
      routeData.depart_lat, routeData.depart_lng,
      routeData.arrivee_lat, routeData.arrivee_lng
    );
    
    return totalDistance >0 ? Math.min(100, (deliveryDistance / totalDistance) * 100) : 50;
  }
  
  // Calcul précis avec les coordonnées
  const totalDistance = getDistance(
    annonce.depart_lat, annonce.depart_lng,
    annonce.arrivee_lat, annonce.arrivee_lng
  );
  
  const deliveryDistance = getDistance(
    routeData.depart_lat, routeData.depart_lng,
    routeData.arrivee_lat, routeData.arrivee_lng
  );
  
  return totalDistance >0 ? Math.min(100, (deliveryDistance / totalDistance) *100) : 100;
}

// Fonction utilitaire pour calculer la distance entre deux points
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = LivraisonModel;
