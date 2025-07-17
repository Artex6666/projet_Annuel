const express = require('express');
const router = express.Router();
const axios = require('axios');

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Middleware pour vérifier l'authentification
const checkAuth = async (req, res, next) => {
  const token = req.cookies.token;
  
  // Vérifier si l'utilisateur est connecté
  if (!token) {
    return res.redirect('/');
  }
  
  try {
    // Vérifier la validité du token
    const response = await axios.get('http://localhost:3000/api/users/me', {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    
    if (response.status !== 200) {
      return res.redirect('/');
    }
    
    const data = response.data;
    if (!data.user) {
      return res.redirect('/');
    }
    
    req.user = data.user; // Stocker les données de l'utilisateur dans req
    next();
  } catch (err) {
    console.error('Erreur vérification authentification:', err.message);
    res.redirect('/');
  }
};

// Accueil
router.get('/', async (req, res) => {
  try {
    const apiRes = await axios.get('http://localhost:3000/annonces');
    const annonces = apiRes.data;
    const avis = [
      { nom: 'Sarah M.', texte: 'Service impeccable, rapide et très humain.' },
      { nom: 'Yann D.', texte: "J'ai économisé 20€ grâce à EcoDeli, je recommande !" },
      { nom: 'Lucie G.', texte: 'Concept écologique au top, bravo.' },
      { nom: 'Karim B.', texte: 'Livreur ponctuel et très sympa, colis arrivé en parfait état.' },
      { nom: 'Emma T.', texte: 'Première expérience, tout était simple et sécurisé.' },
      { nom: 'Pauline R.', texte: "J'ai pu envoyer un colis à ma sœur sans me ruiner, merci !" }
    ];
    res.render('accueil', {
      title: 'Accueil',
      annonces,
      avis
    });
  } catch (err) {
    console.error('Erreur récupération annonces pour accueil:', err.message);
    res.render('accueil', {
      title: 'Accueil',
      annonces: [],
      avis: []
    });
  }
});

// Inscription
router.get('/register', (req, res) => {
  res.render('index', { title: 'Inscription' });
});

// Mon compte
router.get('/account', (req, res) => {
  res.render('account', { title: 'Mon Compte' });
});

// Déconnexion
router.get('/logout', (req, res) => {
  res.send(`<script>localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'</script>`);
});

// Annonces personnelles
router.get('/mes-annonces', checkAuth, (req, res) => {
  res.render('mes-annonces', { title: 'Mes Annonces' });
});

// ✅ Mes livraisons
router.get('/mes-livraisons', checkAuth, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3000/api/livraisons/mes', {
      headers: {
        'Cookie': `token=${req.cookies.token}`
      }
    });

    const livraisons = response.data;
    res.render('mes-livraisons', { title: 'Mes Livraisons', livraisons });
  } catch (err) {
    console.error('Erreur récupération livraisons :', err.message);
    res.render('mes-livraisons', { title: 'Mes Livraisons', livraisons: [] });
  }
});

// ✅ Page de livraison individuelle
router.get('/livraison/:id', checkAuth, async (req, res) => {
  const livraisonId = req.params.id;

  try {
    // Récupérer les informations de la livraison
    const response = await axios.get(`http://localhost:3000/api/livraisons/${livraisonId}`, {
      headers: {
        'Cookie': `token=${req.cookies.token}`
      }
    });

    if (response.status !== 200) {
      throw new Error('Livraison non trouvée');
    }

    const livraison = response.data;
    
    // Récupérer les informations utilisateur
    const userResponse = await axios.get('http://localhost:3000/api/users/me', {
      headers: {
        'Cookie': `token=${req.cookies.token}`
      }
    });
    
    const userData = userResponse.data;
    
    res.render('livraison', { 
      title: `Livraison - ${livraison.titre}`, 
      livraison,
      user: userData.user
    });
  } catch (err) {
    console.error('Erreur récupération livraison :', err.message);
    res.status(404).render('404', { 
      title: 'Livraison introuvable',
      error: 'Livraison non trouvée ou erreur lors de la récupération.'
    });
  }
});

// ✅ Prendre en charge une livraison (via formulaire)
router.post('/livraisons/prendre', checkAuth, async (req, res) => {
  const annonceId = req.body.annonceId;

  try {
    const apiRes = await axios.post('http://localhost:3000/api/livraisons', { annonce_id: annonceId }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${req.cookies.token}`
      },
      withCredentials: true
    });

    if (apiRes.status !== 200) {
      const err = apiRes.data;
      console.error('Erreur API:', err);
      return res.redirect(`/annonces/${annonceId}`);
    }

    res.redirect('/mes-livraisons');
  } catch (err) {
    console.error("Erreur prise en charge:", err.message);
    res.redirect(`/annonces/${annonceId}`);
  }
});

// ✅ Marquer une livraison comme livrée
router.post('/livraison/:id/livrer', checkAuth, async (req, res) => {
  const id = req.params.id;

  try {
    await axios.post(`http://localhost:3000/api/livraisons/${id}/livrer`, {}, {
      headers: {
        'Cookie': `token=${req.cookies.token}`,
        'Content-Type': 'application/json'
      }
    });
    res.redirect('/mes-livraisons');
  } catch (err) {
    console.error("Erreur de livraison :", err.message);
    res.redirect('/mes-livraisons');
  }
});

// ✅ Prendre en charge une livraison (formulaire côté MPA)
router.post('/livraisons/prendre', checkAuth, async (req, res) => {
  const annonceId = req.body.annonceId;

  try {
    const response = await axios.post('http://localhost:3000/api/livraisons', { annonce_id: annonceId }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${req.cookies.token}`
      },
      withCredentials: true
    });

    if (response.status !== 200) {
      const err = response.data;
      console.error('Erreur API :', err);
      return res.redirect(`/annonces/${annonceId}`);
    }

    res.redirect('/mes-livraisons');
  } catch (err) {
    console.error('Erreur prise en charge :', err.message);
    res.redirect(`/annonces/${annonceId}`);
  }
});

module.exports = router;
