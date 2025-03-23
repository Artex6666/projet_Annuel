const UserModel = require('../models/userModel');

const UserController = {
  getPendingUsers: (req, res, next) => {
    UserModel.getPendingUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },
  getValidatedUsers: (req, res, next) => {
    UserModel.getValidatedUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },
  getUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.getUserById(id, (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(row);
    });
  },
  createUser: (req, res, next) => {
    const user = req.body;
    UserModel.createUser(user, (err, id) => {
      if (err) return next(err);
      res.status(201).json({ id, ...user });
    });
  },
  validateUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.updateUserValidation(id, 1, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur validé avec succès" });
    });
  },
  deleteUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.deleteUser(id, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur supprimé avec succès" });
    });
  },
  recheckUser: (req, res, next) => {
    const id = req.params.id;
    // Remet l'utilisateur en attente (is_validated = 0)
    UserModel.updateUserValidation(id, 0, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur renvoyé en vérification" });
    });
  },
  updateUserRole: (req, res, next) => {
    const id = req.params.id;
    const { role } = req.body;
    UserModel.updateUserRole(id, role, (err) => {
      if (err) return next(err);
      res.json({ message: "Rôle mis à jour avec succès" });
    });
  },
  getUserDocuments: (req, res, next) => {
    const userId = req.params.id;
    // Faudra faire la table documents apres
    res.json({
      userId,
      docs: [
        { id: 1, document_name: "Carte d'identité", document_url: "/path/carte_id.pdf" },
        { id: 2, document_name: "Justificatif de domicile", document_url: "/path/domicile.pdf" }
      ]
    });
  }
};

module.exports = UserController;
