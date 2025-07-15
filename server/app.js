const express = require('express');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
<<<<<<< HEAD
const path = require('path');

const app = express();
const { port } = require('./config/config');

// 📦 Imports routes
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const livraisonRoutes = require('./routes/livraisonRoutes'); // ✅ important

// 🧩 Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🌍 CORS : autorise les frontends
=======
const app = express();
const { port } = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const annonceRoutes = require('./routes/annonceRoutes');
const path = require('path');

app.use(cookieParser());

// Configuration CORS détaillée
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-XSRF-TOKEN']
}));

<<<<<<< HEAD
// 📂 Fichiers statiques (documents uploadés)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 📚 Swagger API docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🛣️ Routes
app.use('/api/users', userRoutes);
app.use('/api/stats', dashboardRoutes);
app.use('/annonces', annonceRoutes);
app.use('/api/livraisons', livraisonRoutes); // ✅ pour le front SPA
app.use('/livraison', livraisonRoutes);      // ✅ pour les boutons HTML

// ❌ Gestion des erreurs
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 🚀 Démarrage
=======
app.use(express.json());

// Swagger : Doc accessible sur /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes de l'API
app.use('/api/users', userRoutes);
app.use('/api/stats', dashboardRoutes);
app.use('/annonces', annonceRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(errorHandler);

>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
app.listen(port, () => {
  console.log('=================================='.green);
  console.log(`Serveur démarré sur le port ${port}`.cyan.bold);
  console.log('=================================='.green);
});
