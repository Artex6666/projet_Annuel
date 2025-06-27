const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev_secret';
const path = require('path');

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
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('users.email')) {
          return res.status(400).json({ error: 'Compte déjà existant, veuillez vous connecter.' });
        }
        return next(err);
      }
      res.status(201).json({ id, ...user });
    });
  },
  validateUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.updateUserValidationAndType(id, 1, 'livreur', (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur validé et défini comme livreur avec succès" });
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
    UserModel.getDocumentsByUserId(userId, (err, docs) => {
      if (err) return next(err);
      res.json({ userId, docs });
    });
  },
  login: (req, res, next) => {
    const { email, password } = req.body;
    UserModel.getUserByEmail(email.toLowerCase(), async (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      const valid = await UserModel.verifyPassword(user, password);
      if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // true en prod avec HTTPS
        sameSite: 'lax'
      });
      res.json({ user });
    });
  },
  uploadDocument: (req, res, next) => {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
    // Liste des types de documents acceptés
    const allowedDocs = [
      "Carte d'identité",
      "Permis de conduire",
      "Passeport",
      "Justificatif de domicile"
    ];
    const document_name = req.body.document_name;
    if (!allowedDocs.includes(document_name)) {
      return res.status(400).json({ error: 'Type de document non autorisé' });
    }
    const document_url = `/uploads/${userId}/${req.file.filename}`;
    UserModel.addDocument(userId, document_name, document_url, (err, docId) => {
      if (err) return next(err);
      res.status(201).json({ id: docId, document_name, document_url });
    });
  },
  getUsersWithDocuments: (req, res, next) => {
    UserModel.getUsersWithDocuments((err, users) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs avec documents:', err);
        return next(err);
      }
      res.json(users);
    });
  }
};

module.exports = UserController;
