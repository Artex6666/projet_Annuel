const express = require('express');
const colors = require('colors');
const cors = require('cors');
const app = express();
const { port } = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');


app.use(cors({
  origin: 'http://localhost:8080'
}));


app.use(express.json());

// Swagger : Doc accessible sur /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes de l'API
app.use('/api/users', userRoutes);
app.use('/api/stats', dashboardRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log('=================================='.green);
  console.log(`Serveur démarré sur le port ${port}`.cyan.bold);
  console.log('=================================='.green);
});
