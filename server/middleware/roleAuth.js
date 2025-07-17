// Middleware pour vérifier les rôles utilisateur
// Utiliser administrateur (et pas 'admin') pour la cohérence avec la base de données
module.exports = function(allowedRoles) {
  return function(req, res, next) {
    // Vérifier si l'utilisateur est connecté
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non connecté' });
    }



    // Vérifier si l'utilisateur a un des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit : rôle insuffisant' });
    }

    next();
  };
}; 