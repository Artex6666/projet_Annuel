const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const secret = process.env.JWT_SECRET || 'dev_secret';

function jwtAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });

    UserModel.getUserById(decoded.id, (err, user) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
      }
      if (!user) {
        console.error('Utilisateur non trouvé pour l\'ID:', decoded.id);
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      req.user = user;
      next();
    });
  });
}

module.exports = jwtAuth;
