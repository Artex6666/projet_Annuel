const allowedRoles = ['modérateur', 'administrateur'];

module.exports = function(req, res, next) {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès interdit : rôle insuffisant' });
  }
  next();
}; 