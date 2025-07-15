<<<<<<< HEAD
const express = require('express');
const router = express.Router();

// Liste des annonces ouvertes
router.get('/', async (req, res) => {
  try {
    const apiRes = await fetch('http://localhost:3000/annonces');
    const allAnnonces = await apiRes.json();

    // ✅ On ne garde que celles avec statut "ouverte"
    const annonces = allAnnonces.filter(a => a.statut === 'ouverte');

    res.render('annonces', {
      title: 'Annonces disponibles',
      annonces
    });
  } catch (err) {
    console.error('Erreur récupération annonces :', err);
    res.render('annonces', {
      title: 'Annonces disponibles',
=======
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
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      annonces: [],
      error: 'Erreur lors de la récupération des annonces.'
    });
  }
});

<<<<<<< HEAD
// Détail d'une annonce
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
router.get('/:id', async (req, res) => {
  try {
    const apiRes = await fetch(`http://localhost:3000/annonces/${req.params.id}`);
    if (!apiRes.ok) throw new Error('Annonce non trouvée');
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    const annonce = await apiRes.json();
    res.render('annonce', {
      title: annonce.titre || 'Annonce',
      annonce
    });
  } catch (err) {
<<<<<<< HEAD
    console.error('Erreur affichage annonce :', err);
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    res.status(404).render('annonce', {
      title: 'Annonce introuvable',
      annonce: null,
      error: 'Annonce non trouvée ou erreur lors de la récupération.'
    });
  }
});

module.exports = router;
