const livraisonModel = require('../models/livraisonModel');

// ✅ Annuler une livraison → statut = 'annulee', garder livreur_id
exports.annulerLivraison = (req, res, next) => {
  const livraisonId = req.params.id;
  const livreurId = req.user.id;

  livraisonModel.updateStatutEtLivreur(livraisonId, 'annulee', livreurId, (err) => {
    if (err) return next(err);
    res.redirect('/mes-livraisons'); // ou '/annonces' si tu préfères
  });
};

// ✅ Le livreur démarre la course
exports.departLivraison = (req, res, next) => {
  const livraisonId = req.params.id;
  const livreurId = req.user.id;

  livraisonModel.updateStatutEtLivreur(livraisonId, 'en_livraison', livreurId, (err) => {
    if (err) return next(err);
    res.redirect('/mes-livraisons');
  });
};

// ✅ Le livreur valide la course
exports.validerLivraison = (req, res, next) => {
  const livraisonId = req.params.id;

  livraisonModel.updateStatut(livraisonId, 'livree', (err) => {
    if (err) return next(err);
    res.redirect('/mes-livraisons');
  });
};
