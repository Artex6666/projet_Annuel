const express = require('express');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-XSRF-TOKEN']
}));

app.use(express.json());

// Swagger : Doc accessible sur /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes de l'API
app.use('/api/users', userRoutes);
app.use('/api/stats', dashboardRoutes);
app.use('/annonces', annonceRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(errorHandler);

app.listen(port, () => {
  console.log('=================================='.green);
  console.log(`Serveur démarré sur le port ${port}`.cyan.bold);
  console.log('=================================='.green);
});
