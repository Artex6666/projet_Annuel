const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');
const LivraisonController = require('../controllers/livraisonController');

// Prise en charge d'une annonce par un livreur avec trajet personnalisé
router.post('/', jwtAuth, LivraisonController.createDelivery);

// Récupérer les livraisons du livreur connecté
router.get('/mes', jwtAuth, LivraisonController.getDeliveriesByUser);

// Récupérer une livraison par ID
router.get('/:id', jwtAuth, LivraisonController.getDeliveryById);

// Marquer une livraison comme terminée
router.post('/:id/livrer', jwtAuth, LivraisonController.markAsDelivered);

module.exports = router;
