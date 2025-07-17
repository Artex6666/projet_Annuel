const userService = require('../services/userService');
const UserModel = require('../models/userModel');

class UserController {

  // Inscription d'un nouvel utilisateur
  static async register(req, res) {
    try {
      const userData = req.body;
      const userId = await userService.createUser(userData);
      
      res.status(201).json({ 
        message: 'Utilisateur créé avec succès',
        id: userId 
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Connexion utilisateur
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const user = await userService.authenticateUser(email, password);
      const token = userService.generateToken(user);

      // Définir les cookies
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });

      // Extraire nom et prénom du champ name
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      const prenom = nameParts[0] || '';
      const nom = nameParts.slice(1).join(' ') || '';

      res.cookie('user', JSON.stringify({
        id: user.id,
        email: user.email,
        nom: nom,
        prenom: prenom,
        type: user.type
      }), {
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });

      res.json({ 
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          nom: nom,
          prenom: prenom,
          type: user.type
        }
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(401).json({ error: error.message });
    }
  }

  // Récupérer le profil de l'utilisateur connecté
  static async getMe(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Extraire nom et prénom du champ name
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      const prenom = nameParts[0] || '';
      const nom = nameParts.slice(1).join(' ') || '';

      // Ne pas renvoyer le mot de passe
      const { password, name, ...userWithoutPassword } = user;
      res.json({ 
        user: {
          ...userWithoutPassword,
          nom: nom,
          prenom: prenom
        }
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
  }

  // Récupérer un utilisateur par ID (admin)
  static async getUserById(req, res) {
    try {
      const userId = req.params.id;
      const user = await userService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier les permissions
      if (!userService.canAccessResource(req.user, userId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Extraire nom et prénom du champ name
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      const prenom = nameParts[0] || '';
      const nom = nameParts.slice(1).join(' ') || '';

      const { password, name, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        nom: nom,
        prenom: prenom
      });
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
  }

  // Récupérer tous les utilisateurs (admin)
  static async getAllUsers(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }

  // Mettre à jour un utilisateur
  static async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Vérifier les permissions
      if (!userService.canAccessResource(req.user, userId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      await userService.updateUser(userId, updateData);
      res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
  }

  // Supprimer un utilisateur (admin)
  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      await userService.deleteUser(userId);
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  }

  // Méthodes spécifiques pour la gestion des livreurs (admin)
  static async getPendingUsers(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      const users = await userService.getPendingUsers();
      res.json(users);
    } catch (error) {
      console.error('Erreur récupération utilisateurs en attente:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
  }

  static async validateUser(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      await userService.validateUser(req.params.id);
      res.json({ message: "Utilisateur validé et défini comme livreur avec succès" });
    } catch (error) {
      console.error('Erreur validation utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la validation' });
    }
  }

  // Déconnexion
  static logout(req, res) {
    res.clearCookie('token');
    res.clearCookie('user');
    res.json({ message: 'Déconnexion réussie' });
  }

  static async recheckUser(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      await userService.recheckUser(req.params.id);
      res.json({ message: "Utilisateur renvoyé en vérification avec succès" });
    } catch (error) {
      console.error('Erreur recheck utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors du recheck' });
    }
  }

  static async updateUserRole(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      await userService.updateUserRole(req.params.id, req.body.role);
      res.json({ message: "Rôle mis à jour avec succès" });
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour du rôle' });
    }
  }

  static async getUserDocuments(req, res) {
    try {
      if (!userService.hasRole(req.user, 'administrateur')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      const docs = await userService.getUserDocuments(req.params.id);
      res.json({ docs });
    } catch (error) {
      console.error('Erreur récupération documents:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
    }
  }
}

module.exports = UserController;
