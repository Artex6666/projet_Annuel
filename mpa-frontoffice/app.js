const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// Moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

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
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

// Serveur
app.listen(4000, () => {
  console.log('EcoDeli est en ligne sur http://localhost:4000');
});
