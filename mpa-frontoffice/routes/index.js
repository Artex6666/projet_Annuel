const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Accueil
=======

>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
router.get('/', async (req, res) => {
  try {
    const apiRes = await fetch('http://localhost:3000/annonces');
    const annonces = await apiRes.json();
    const avis = [
      { nom: 'Sarah M.', texte: 'Service impeccable, rapide et très humain.' },
      { nom: 'Yann D.', texte: "J'ai économisé 20€ grâce à EcoDeli, je recommande !" },
      { nom: 'Lucie G.', texte: 'Concept écologique au top, bravo.' },
      { nom: 'Karim B.', texte: 'Livreur ponctuel et très sympa, colis arrivé en parfait état.' },
      { nom: 'Emma T.', texte: 'Première expérience, tout était simple et sécurisé.' },
      { nom: 'Pauline R.', texte: "J'ai pu envoyer un colis à ma sœur sans me ruiner, merci !" }
    ];
<<<<<<< HEAD
    res.render('accueil', { title: 'Accueil', annonces, avis });
  } catch (err) {
    res.render('accueil', { title: 'Accueil', annonces: [], avis: [] });
  }
});

// Inscription
router.get('/register', (req, res) => res.render('index', { title: 'Inscription' }));

// Mon compte
router.get('/account', (req, res) => res.render('account', { title: 'Mon Compte' }));

// Déconnexion
=======
    res.render('accueil', {
      title: 'Accueil',
      annonces,
      avis
    });
  } catch (err) {
    res.render('accueil', {
      title: 'Accueil',
      annonces: [],
      avis: []
    });
  }
});

router.get('/register', (req, res) => {
  res.render('index', { title: 'Inscription' });
});

router.get('/account', (req, res) => {
  res.render('account', { title: 'Mon Compte' });
});

>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
router.get('/logout', (req, res) => {
  res.send(`<script>localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'</script>`);
});

<<<<<<< HEAD
// Mes annonces
router.get('/mes-annonces', (req, res) => res.render('mes-annonces', { title: 'Mes Annonces' }));

// ✅ Mes livraisons
router.get('/mes-livraisons', async (req, res) => {
  const token = req.cookies.token;

  try {
    const response = await fetch('http://localhost:3000/api/livraisons/mes', {
      headers: {
        'Cookie': `token=${token}`
      }
    });

    const livraisons = await response.json();
    res.render('mes-livraisons', { title: 'Mes Livraisons', livraisons });
  } catch (err) {
    console.error('Erreur récupération livraisons :', err);
    res.render('mes-livraisons', { title: 'Mes Livraisons', livraisons: [] });
  }
});

// ✅ Prendre en charge une livraison
router.post('/livraisons/prendre', async (req, res) => {
  const token = req.cookies.token;
  const annonceId = req.body.annonceId;

  try {
    const response = await fetch('http://localhost:3000/api/livraisons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ annonce_id: annonceId })
    });

    if (!response.ok) {
      const err = await response.text(); // ← si HTML (erreur), pas json()
      console.error('Erreur API :', err);
      return res.redirect(`/annonces/${annonceId}`);
    }

    res.redirect('/mes-livraisons');
  } catch (err) {
    console.error('Erreur prise en charge :', err);
    res.redirect(`/annonces/${annonceId}`);
  }
});

// ✅ Marquer une livraison comme livrée
router.post('/livraison/:id/livrer', async (req, res) => {
  const token = req.cookies.token;
  const id = req.params.id;

  try {
    await fetch(`http://localhost:3000/api/livraisons/${id}/livrer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      }
    });
    res.redirect('/mes-livraisons');
  } catch (err) {
    console.error('Erreur de livraison :', err);
    res.redirect('/mes-livraisons');
  }
=======
router.get('/mes-annonces', (req, res) => {
  res.render('mes-annonces', { title: 'Mes Annonces' });
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
});

module.exports = router;
