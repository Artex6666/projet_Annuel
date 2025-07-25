const express = require('express'); 
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');

// Configuration du moteur EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware globaux
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ✅ Injecte l'utilisateur dans toutes les vues EJS
app.use((req, res, next) => {
  try {
    res.locals.user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  } catch (e) {
    res.locals.user = null;
  }
  next();
});

// Routes
const annoncesRouter = require('./routes/annonces');
app.use('/annonces', annoncesRouter);

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Redirection par défaut vers /accueil
app.get('/', (req, res) => res.redirect('/accueil'));

// Gestion 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

// Lancement du serveur
app.listen(4000, () => {
  console.log('EcoDeli est en ligne sur http://localhost:4000');
});
