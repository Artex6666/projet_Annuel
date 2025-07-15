const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
<<<<<<< HEAD
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
=======
const secret = process.env.JWT_SECRET || 'dev_secret';
const path = require('path');

const UserController = {
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  getPendingUsers: (req, res, next) => {
    UserModel.getPendingUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },
<<<<<<< HEAD

  // Utilisateurs déjà validés
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  getValidatedUsers: (req, res, next) => {
    UserModel.getValidatedUsers((err, rows) => {
      if (err) return next(err);
      res.json(rows);
    });
  },
<<<<<<< HEAD

  // Détail d’un utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  getUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.getUserById(id, (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(row);
    });
  },
<<<<<<< HEAD

  // Infos de l'utilisateur connecté
  getMe: (req, res) => {
    const { id, name, email, role, type } = req.user;
    res.json({ user: { id, name, email, role, type } });
  },

  // Création d'un compte utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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
<<<<<<< HEAD

  // Valider un utilisateur en tant que livreur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  validateUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.updateUserValidationAndType(id, 1, 'livreur', (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur validé et défini comme livreur avec succès" });
    });
  },
<<<<<<< HEAD

  // Supprimer un utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  deleteUser: (req, res, next) => {
    const id = req.params.id;
    UserModel.deleteUser(id, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur supprimé avec succès" });
    });
  },
<<<<<<< HEAD

  // Renvoyer un utilisateur en vérification
  recheckUser: (req, res, next) => {
    const id = req.params.id;
=======
  recheckUser: (req, res, next) => {
    const id = req.params.id;
    // Remet l'utilisateur en attente (is_validated = 0)
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    UserModel.updateUserValidation(id, 0, (err) => {
      if (err) return next(err);
      res.json({ message: "Utilisateur renvoyé en vérification" });
    });
  },
<<<<<<< HEAD

  // Mettre à jour le rôle d’un utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  updateUserRole: (req, res, next) => {
    const id = req.params.id;
    const { role } = req.body;
    UserModel.updateUserRole(id, role, (err) => {
      if (err) return next(err);
      res.json({ message: "Rôle mis à jour avec succès" });
    });
  },
<<<<<<< HEAD

  // Obtenir les documents d’un utilisateur
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
  getUserDocuments: (req, res, next) => {
    const userId = req.params.id;
    UserModel.getDocumentsByUserId(userId, (err, docs) => {
      if (err) return next(err);
      res.json({ userId, docs });
    });
  },
<<<<<<< HEAD

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

=======
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
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    const allowedDocs = [
      "Carte d'identité",
      "Permis de conduire",
      "Passeport",
      "Justificatif de domicile"
    ];
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    const document_name = req.body.document_name;
    if (!allowedDocs.includes(document_name)) {
      return res.status(400).json({ error: 'Type de document non autorisé' });
    }
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    const document_url = `/uploads/${userId}/${req.file.filename}`;
    UserModel.addDocument(userId, document_name, document_url, (err, docId) => {
      if (err) return next(err);
      res.status(201).json({ id: docId, document_name, document_url });
    });
  },
<<<<<<< HEAD

  // Utilisateurs avec documents
=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
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
