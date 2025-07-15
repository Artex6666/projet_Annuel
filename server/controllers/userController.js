const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const path = require('path');

const secret = process.env.JWT_SECRET || 'dev_secret';

const UserController = {
  // Récupère tous les utilisateurs
  getAllUsers: (req, res, next) => {
    UserModel.getAllUsers((err, users) => {
      if (err) return next(err);
      res.json(users);
    });
  },

  // Utilisateurs en attente de validation
  getPendingUsers: (req, res, next) => {
    UserModel.getPendingUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },

  // Utilisateurs déjà validés
  getValidatedUsers: (req, res, next) => {
    UserModel.getValidatedUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },

  // Détail d’un utilisateur
  getUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.getUserById(id, (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(row);
    });
  },

  // Infos de l'utilisateur connecté
  getMe: (req, res) => {
    const { id, name, email, role, type } = req.user;
    res.json({ user: { id, name, email, role, type } });
  },

  // Création d'un compte utilisateur
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

  // Valider un utilisateur en tant que livreur
  validateUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.updateUserValidationAndType(id, 1, 'livreur', (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur validé et défini comme livreur avec succès" });
    });
  },

  // Supprimer un utilisateur
  deleteUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.deleteUser(id, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur supprimé avec succès" });
    });
  },

  // Renvoyer un utilisateur en vérification
  recheckUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.updateUserValidation(id, 0, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur renvoyé en vérification" });
    });
  },

  // Mettre à jour le rôle d’un utilisateur
  updateUserRole: (req, res, next) => {
    const id = req.params.id;
    const { role } = req.body;
    UserModel.updateUserRole(id, role, (err) => {
      if (err) return next(err);
      res.json({ message: "Rôle mis à jour avec succès" });
    });
  },

  // Obtenir les documents d’un utilisateur
  getUserDocuments: (req, res, next) => {
    const userId = req.params.id;
    UserModel.getDocumentsByUserId(userId, (err, docs) => {
      if (err) return next(err);
      res.json({ userId, docs });
    });
  },

  // Authentification : connexion
  login: (req, res, next) => {
    const { email, password } = req.body;

    UserModel.getUserByEmail(email.toLowerCase(), async (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

      const valid = await UserModel.verifyPassword(user, password);
      if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

      // Création du token avec tous les champs utiles
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          type: user.type
        },
        secret,
        { expiresIn: '24h' }
      );

      // Cookie JWT
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // mettre à true en production HTTPS
        sameSite: 'lax'
      });

      // Cookie lisible par le front si besoin
      res.cookie('user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: user.type
      }), {
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });

      res.json({ user });
    });
  },

  // Déconnexion
  logout: (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    });
    res.json({ message: 'Déconnecté avec succès' });
  },

  // Upload d’un document utilisateur
  uploadDocument: (req, res, next) => {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });

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

  // Utilisateurs avec documents
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
