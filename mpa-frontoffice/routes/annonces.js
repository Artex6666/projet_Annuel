const express = require('express');
const router = express.Router();
const axios = require('axios');

// Liste des annonces ouvertes
router.get('/', async (req, res) => {
  try {
    const apiRes = await axios.get('http://localhost:3000/annonces');
    const allAnnonces = apiRes.data;

    const annonces = allAnnonces.filter(a => a.statut === 'ouverte');

    res.render('annonces', {
      title: 'Annonces disponibles',
      annonces
    });
  } catch (err) {
    console.error('❌ Erreur récupération annonces :', err.message);
    res.render('annonces', {
      title: 'Annonces disponibles',
      annonces: [],
      error: 'Erreur lors de la récupération des annonces: ' + err.message
    });
  }
});

// Détail d'une annonce
router.get('/:id', async (req, res) => {
  try {
    const apiRes = await axios.get(`http://localhost:3000/annonces/${req.params.id}`);
    const annonce = apiRes.data;
    
    // Récupérer les informations utilisateur si connecté
    let user = null;
    const token = req.cookies.token;
    
    if (token) {
      try {
        const userResponse = await axios.get('http://localhost:3000/api/users/me', {
          headers: {
            'Cookie': `token=${token}`
          }
        });
        
        user = userResponse.data.user;
      } catch (userError) {
        console.error('Erreur récupération utilisateur:', userError.message);
      }
    }
    
    res.render('annonce', {
      title: annonce.titre || 'Annonce',
      annonce,
      user
    });
  } catch (err) {
    console.error('Erreur affichage annonce :', err.message);
    let errorMessage = 'Annonce non trouvée ou erreur lors de la récupération.';
    
    if (err.response && err.response.status === 404) {
      errorMessage = 'Annonce non trouvée.';
    }
    
    res.status(404).render('annonce', {
      title: 'Annonce introuvable',
      annonce: null,
      error: errorMessage,
      user: null
    });
  }
});

module.exports = router;
