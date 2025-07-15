<<<<<<< HEAD
const express = require('express'); 
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');

// 📁 Configuration EJS
=======
const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// Moteur de templates
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

<<<<<<< HEAD
// 📂 Middleware globaux
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧠 Injecter l'utilisateur connecté dans toutes les vues
app.use((req, res, next) => {
  try {
    res.locals.user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  } catch (e) {
    res.locals.user = null;
  }
  next();
});

// 🛣️ Routeurs
const indexRouter = require('./routes/index');
const annoncesRouter = require('./routes/annonces');
const livraisonRouter = require('./routes/livraison'); // ✅ ajouté ici

app.use('/', indexRouter);
app.use('/annonces', annoncesRouter);
app.use('/livraison', livraisonRouter); // ✅ activé ici

// 🏠 Redirection vers accueil
app.get('/', (req, res) => res.redirect('/accueil'));

// ❌ Gestion des erreurs 404
=======
// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const annoncesRouter = require('./routes/annonces');
app.use('/annonces', annoncesRouter);

const indexRouter = require('./routes/index');
app.use('/', indexRouter);


// Accueil
app.get('/', (req, res) => res.redirect('/accueil'));

// Gestion 404 (à placer avant app.listen)
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

<<<<<<< HEAD
// 🚀 Lancement
=======
// Serveur
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
app.listen(4000, () => {
  console.log('EcoDeli est en ligne sur http://localhost:4000');
});
