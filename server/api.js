const express = require('express');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const GeocodeCacheModel = require('./models/geocodeCache');

const app = express();
const { port } = require('./config/config');

const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const livraisonRoutes = require('./routes/livraisonRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Middleware global
app.use(cookieParser()); // ✅ indispensable avant jwtAuth
app.use(express.json());

// CORS
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:4000',
    'https://axia.quest',
    'https://www.axia.quest',
    'https://admin.axia.quest',
    'https://api.axia.quest'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-XSRF-TOKEN']
}));

// Gestion explicite des requêtes OPTIONS pour CORS
app.options('*', cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:4000',
    'https://axia.quest',
    'https://www.axia.quest',
    'https://admin.axia.quest',
    'https://api.axia.quest'
  ],
  credentials: true
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stats', dashboardRoutes);
app.use('/annonces', annonceRoutes);
app.use('/api/livraisons', livraisonRoutes);

// Gestion des erreurs
app.use(errorHandler);

// Serveur
app.listen(port, () => {
  console.log('=================================='.green);
  console.log(`Serveur démarré sur le port ${port}`.cyan.bold);
  console.log('=================================='.green);
  
  // Nettoyer le cache toutes les heures
  setInterval(() => {
    GeocodeCacheModel.cleanup();
    console.log('🧹 Cache géocodage nettoyé');
  }, 60 * 60 * 1000); // 1 heure
});
