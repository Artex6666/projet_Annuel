const LivraisonModel = require('../models/livraisonModel');
const livraisonService = require('../services/livraisonService');
const db = require('../models/db');

class LivraisonController {
  // Prise en charge d'une annonce par un livreur
  static async createDelivery(req, res) {
    try {
      const { annonce_id, depart_livraison, arrivee_livraison, depart_lat, depart_lng, arrivee_lat, arrivee_lng } = req.body;
      const livreur_id = req.user.id;

      // Validation des données requises
      if (!annonce_id || !depart_livraison || !arrivee_livraison) {
        return res.status(400).json({ 
          error: 'Données manquantes (annonce_id, depart_livraison, arrivee_livraison)' 
        });
      }

      // Récupérer l'annonce via le service
      const annonce = await livraisonService.getAnnonceById(annonce_id);
      if (!annonce) {
        return res.status(400).json({ error: 'Annonce introuvable.' });
      }

      // Valider le trajet via le service
      const validation = await livraisonService.validateDeliveryRoute(annonce, {
        depart_lat, depart_lng, arrivee_lat, arrivee_lng
      });
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }

      // Créer la livraison via le service
      const livraisonId = await livraisonService.createDelivery(annonce_id, livreur_id, {
        depart_livraison, arrivee_livraison, depart_lat, depart_lng, arrivee_lat, arrivee_lng
      });

      res.status(201).json({
        message: 'Annonce prise en charge avec succès',
        livraison_id: livraisonId
      });

    } catch (error) {
      console.error('Erreur création livraison:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur lors de la prise en charge.' 
      });
    }
  }

  // Récupérer les livraisons d'un livreur
  static async getDeliveriesByUser(req, res) {
    try {
      const livreur_id = req.user.id;
      const livraisons = await livraisonService.getDeliveriesByUserId(livreur_id);
      
      res.json(livraisons);
    } catch (error) {
      console.error('Erreur récupération livraisons:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des livraisons' 
      });
    }
  }

  // Récupérer une livraison par ID
  static async getDeliveryById(req, res) {
    try {
      const livraisonId = req.params.id;
      const livreur_id = req.user.id;

      const livraison = await livraisonService.getDeliveryById(livraisonId, livreur_id);
      
      if (!livraison) {
        return res.status(404).json({ error: 'Livraison non trouvée' });
      }

      res.json(livraison);
    } catch (error) {
      console.error('Erreur récupération livraison:', error);
      if (error.message === 'Non autorisé') {
        return res.status(403).json({ error: 'Accès non autorisé à cette livraison' });
      }
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la livraison' 
      });
    }
  }

  // Marquer une livraison comme terminée
  static async markAsDelivered(req, res) {
    try {
      const livraison_id = req.params.id;
      const livreur_id = req.user.id;

      await livraisonService.markDeliveryAsDelivered(livraison_id, livreur_id);
      
      res.json({ message: 'Livraison marquée comme terminée' });
    } catch (error) {
      console.error('Erreur marquage livraison:', error);
      if (error.message === 'Non autorisé') {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      if (error.message === 'Livraison non trouvée') {
        return res.status(404).json({ error: 'Livraison non trouvée' });
      }
      res.status(500).json({ 
        error: 'Erreur lors du marquage de la livraison' 
      });
    }
  }
}

module.exports = LivraisonController; 