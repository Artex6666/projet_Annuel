const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');
const LivraisonModel = require('../models/livraisonModel');
const livraisonController = require('../controllers/livraisonController');

// 📦 Prise en charge d'une annonce par un livreur
router.post('/', jwtAuth, (req, res) => {
  const { annonce_id } = req.body;
  const livreur_id = req.user.id;

  if (!annonce_id) {
    return res.status(400).json({ error: 'ID annonce manquant' });
  }

  LivraisonModel.findByAnnonceId(annonce_id, (err, existing) => {
    if (err) {
      console.error('Erreur recherche livraison :', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }

    if (existing) {
      return res.status(400).json({ error: 'Cette annonce est déjà prise en charge.' });
    }

    LivraisonModel.create(annonce_id, livreur_id, (err, id) => {
      if (err) {
        console.error('Erreur insertion livraison :', err);
        return res.status(500).json({ error: 'Erreur lors de la prise en charge.' });
      }

      res.status(201).json({
        message: 'Annonce prise en charge avec succès',
        livraison_id: id
      });
    });
  });
});

// ✅ Récupérer les livraisons du livreur connecté
router.get('/mes', jwtAuth, (req, res) => {
  const livreur_id = req.user.id;

  LivraisonModel.findByLivreurId(livreur_id, (err, livraisons) => {
    if (err) {
      console.error('Erreur récupération livraisons :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des livraisons' });
    }
    res.json(livraisons);
  });
});

// ✅ AJOUTS pour gérer les actions livreur
router.post('/:id/annuler', jwtAuth, livraisonController.annulerLivraison);
router.post('/:id/depart', jwtAuth, livraisonController.departLivraison);
router.post('/:id/valider', jwtAuth, livraisonController.validerLivraison);

module.exports = router;
