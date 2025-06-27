// routes/annonces.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const apiRes = await fetch('http://localhost:3000/annonces');
    const annonces = await apiRes.json();
    res.render('annonces', {
      title: "Annonces disponibles",
      annonces: annonces
    });
  } catch (err) {
    console.log("erreur")
    res.render('annonces', {
      title: "Annonces disponibles",
      annonces: [],
      error: 'Erreur lors de la récupération des annonces.'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const apiRes = await fetch(`http://localhost:3000/annonces/${req.params.id}`);
    if (!apiRes.ok) throw new Error('Annonce non trouvée');
    const annonce = await apiRes.json();
    res.render('annonce', {
      title: annonce.titre || 'Annonce',
      annonce
    });
  } catch (err) {
    res.status(404).render('annonce', {
      title: 'Annonce introuvable',
      annonce: null,
      error: 'Annonce non trouvée ou erreur lors de la récupération.'
    });
  }
});

module.exports = router;
