const express = require('express');
const router = express.Router();

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

router.get('/logout', (req, res) => {
  res.send(`<script>localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'</script>`);
});

router.get('/mes-annonces', (req, res) => {
  res.render('mes-annonces', { title: 'Mes Annonces' });
});

module.exports = router;
