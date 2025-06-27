// Middleware d'authentification JWT
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev_secret';

function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  }

function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
}

module.exports = errorHandler;
module.exports.jwtAuth = jwtAuth;
  