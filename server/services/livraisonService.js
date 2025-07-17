const db = require('../models/db');
const LivraisonModel = require('../models/livraisonModel');

// Calcul de la distance entre deux points (Haversine)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Validation métier du trajet de livraison
async function validateDeliveryRoute(annonce, routeData) {
  // Vérifier que les coordonnées de la livraison sont présentes
  if (!routeData.depart_lat || !routeData.depart_lng || !routeData.arrivee_lat || !routeData.arrivee_lng) {
    return { valid: false, message: 'Coordonnées manquantes pour valider le trajet.' };
  }

  // Si l'annonce napas de coordonnées stockées, on ne peut pas faire de validation de distance
  // On accepte la livraison sans validation géographique stricte
  if (!annonce.depart_lat || !annonce.depart_lng || !annonce.arrivee_lat || !annonce.arrivee_lng) {
    console.log('⚠️ Annonce sans coordonnées, validation géographique ignorée');
    return { valid: true };
  }

  const totalDistance = getDistanceKm(annonce.depart_lat, annonce.depart_lng, annonce.arrivee_lat, annonce.arrivee_lng);
  const deliveryDistance = getDistanceKm(routeData.depart_lat, routeData.depart_lng, routeData.arrivee_lat, routeData.arrivee_lng);
  const distanceFromOriginalStart = getDistanceKm(annonce.depart_lat, annonce.depart_lng, routeData.depart_lat, routeData.depart_lng);
  const distanceFromOriginalEnd = getDistanceKm(annonce.arrivee_lat, annonce.arrivee_lng, routeData.arrivee_lat, routeData.arrivee_lng);

  // Tolérances (doivent être cohérentes avec le front)
  const tolerance = 50; // km
  if (distanceFromOriginalStart > tolerance && distanceFromOriginalEnd > tolerance) {
    return { valid: false, message: 'Votre trajet doit être cohérent avec le trajet original.' };
  }
  if (deliveryDistance > totalDistance * 1.5) {
    return { valid: false, message: 'Votre trajet fait un détour trop important par rapport au trajet original.' };
  }
  // Si livraison partielle non autorisée, vérifier que c'est le trajet complet
  if (!annonce.livraison_partielle) {
    if (distanceFromOriginalStart > 10 || distanceFromOriginalEnd > 10) {
      return { valid: false, message: 'Cette annonce ne permet pas la livraison partielle. Vous devez effectuer le trajet complet.' };
    }
  }
  return { valid: true };
}

// Récupérer une annonce par ID
async function getAnnonceById(annonceId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM annonces WHERE id = ?', [annonceId], (err, annonce) => {
      if (err) reject(err);
      else resolve(annonce);
    });
  });
}

// Calculer le montant restant à payer sur une annonce
async function getRemainingAmount(annonceId) {
  return new Promise((resolve, reject) => {
    // Récupérer l'annonce pour connaître le montant total
    db.get('SELECT remuneration FROM annonces WHERE id = ?', [annonceId], (err, annonce) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!annonce) {
        reject(new Error('Annonce non trouvée'));
        return;
      }
      
      const totalAmount = annonce.remuneration;
      
      // Récupérer toutes les livraisons terminées pour cette annonce
      db.all(`
        SELECT progress_percentage 
        FROM livraisons 
        WHERE annonce_id = ? AND statut = 'livree' ORDER BY date_livraison ASC
      `, [annonceId], (err, livraisons) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Calculer le montant déjà payé
        let paidAmount = 0;
        livraisons.forEach(livraison => {
          paidAmount += (totalAmount * livraison.progress_percentage / 100);
        });
        
        // Le montant restant
        const remainingAmount = Math.max(0, totalAmount - paidAmount);
        
        resolve({
          totalAmount,
          paidAmount,
          remainingAmount,
          paidDeliveries: livraisons.length
        });
      });
    });
  });
}

// Calculer la rémunération pour une nouvelle livraison
async function calculateDeliveryRemuneration(annonceId, progressPercentage) {
  const remainingData = await getRemainingAmount(annonceId);
  const remuneration = (remainingData.remainingAmount * progressPercentage / 100);
  
  return {
    remuneration: Math.round(remuneration * 100) / 100, // Arrondir à 2 décimales
    remainingAmount: remainingData.remainingAmount,
    totalAmount: remainingData.totalAmount,
    paidAmount: remainingData.paidAmount,
    paidDeliveries: remainingData.paidDeliveries
  };
}

// Calculer la progression d'une livraison
function calculateProgress(annonce, routeData) {
  const totalDistance = getDistanceKm(
    annonce.depart_lat, annonce.depart_lng,
    annonce.arrivee_lat, annonce.arrivee_lng
  );
  
  const deliveryDistance = getDistanceKm(
    routeData.depart_lat, routeData.depart_lng,
    routeData.arrivee_lat, routeData.arrivee_lng
  );
  
  return totalDistance > 0 ? Math.min(100, (deliveryDistance / totalDistance) * 100) : 100;
}

// Créer une livraison avec toute la logique métier
async function createDelivery(annonceId, livreurId, routeData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Récupérer l'annonce
      const annonce = await getAnnonceById(annonceId);
      if (!annonce) {
        reject(new Error('Annonce non trouvée'));
        return;
      }

      // Calculer la progression
      const progressPercentage = calculateProgress(annonce, routeData);

      // Calculer la rémunération
      const remunerationData = await calculateDeliveryRemuneration(annonceId, progressPercentage);

      // Préparer les données pour le modèle
      const modelData = {
        ...routeData,
        progress_percentage: progressPercentage
      };

      // Créer la livraison via le modèle
      LivraisonModel.createWithRoute(annonceId, livreurId, modelData, remunerationData.remuneration, (err, livraisonId) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(livraisonId);
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Récupérer les livraisons d'un utilisateur
async function getDeliveriesByUserId(livreurId) {
  return new Promise((resolve, reject) => {
    LivraisonModel.findByLivreurId(livreurId, (err, livraisons) => {
      if (err) reject(err);
      else resolve(livraisons);
    });
  });
}

// Récupérer une livraison par ID avec vérification d'autorisation
async function getDeliveryById(livraisonId, livreurId) {
  return new Promise((resolve, reject) => {
    LivraisonModel.findById(livraisonId, (err, livraison) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!livraison) {
        resolve(null);
        return;
      }

      // Vérifier que la livraison appartient au livreur
      if (livraison.livreur_id !== livreurId) {
        reject(new Error('Non autorisé'));
        return;
      }

      // Récupérer les informations de l'annonce associée
      db.get(`SELECT * FROM annonces WHERE id = ?`, [livraison.annonce_id], (err, annonce) => {
        if (err) {
          reject(err);
          return;
        }

        // Calculer la rémunération réelle si elle n'est pas déjà calculée
        let remunerationCalculated = livraison.remuneration_calculated;
        if (!remunerationCalculated || remunerationCalculated === 0) {
          remunerationCalculated = (annonce.remuneration * livraison.progress_percentage /100);
        }

        const livraisonComplete = {
          ...livraison,
          titre: annonce?.titre,
          description: annonce?.description,
          depart: annonce?.depart,
          arrivee: annonce?.arrivee,
          date: annonce?.date,
          type: annonce?.type,
          remuneration: annonce?.remuneration,
          remuneration_calculated: remunerationCalculated,
          livraison_partielle: annonce?.livraison_partielle,
          image: annonce?.image
        };

        resolve(livraisonComplete);
      });
    });
  });
}

// Marquer une livraison comme terminée
async function markDeliveryAsDelivered(livraisonId, livreurId) {
  return new Promise((resolve, reject) => {
    // Vérifier que la livraison appartient au livreur
    LivraisonModel.findById(livraisonId, (err, livraison) => {
      if (err) {
        reject(err);
        return;
      }

      if (!livraison) {
        reject(new Error('Livraison non trouvée'));
        return;
      }

      if (livraison.livreur_id !== livreurId) {
        reject(new Error('Non autorisé'));
        return;
      }

      // Marquer comme livrée
      LivraisonModel.markAsDelivered(livraisonId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  getDistanceKm,
  validateDeliveryRoute,
  getAnnonceById,
  createDelivery,
  getDeliveriesByUserId,
  getDeliveryById,
  markDeliveryAsDelivered,
  calculateProgress,
  getRemainingAmount,
  calculateDeliveryRemuneration
}; 