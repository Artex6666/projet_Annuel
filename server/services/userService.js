const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const UserModel = require('../models/userModel');

// Validation des données d'inscription
function validateRegistration(userData) {
  const { email, password, name, type } = userData;
  const errors = [];

  // Validation email
  if (!email || !email.includes('@')) {
    errors.push('Email invalide');
  }

  // Validation mot de passe
  if (!password || password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères');
  }

  // Validation nom et prénom
  if (!name|| name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  // Validation type
  if (!type || !['client', 'livreur', 'admin'].includes(type)) {
    errors.push('Type d\'utilisateur invalide');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Validation des données de connexion
function validateLogin(loginData) {
  const { email, password } = loginData;
  const errors = [];

  if (!email || !email.includes('@')) {
    errors.push('Email invalide');
  }

  if (!password || password.length === 0) {
    errors.push('Mot de passe requis');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Créer un nouvel utilisateur
async function createUser(userData) {
  const validation = validateRegistration(userData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Vérifier si l'email existe déjà
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Un utilisateur avec cet email existe déjà');
  }

  // Adapter les données pour le modèle (nom + prenom -> name)
  const adaptedUserData = {
    name: `${userData.prenom} ${userData.nom}`,
    email: userData.email,
    password: userData.password,
    type: userData.type
  };

  return new Promise((resolve, reject) => {
    UserModel.createUser(adaptedUserData, (err, userId) => {
      if (err) reject(err);
      else resolve(userId);
    });
  });
}

// Authentifier un utilisateur
async function authenticateUser(email, password) {
  const validation = validateLogin({ email, password });
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const isPasswordValid = await UserModel.verifyPassword(user, password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  return user;
}

// Générer un token JWT
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      type: user.type 
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '24h' }
  );
}

// Récupérer un utilisateur par email
async function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    UserModel.getUserByEmail(email, (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

// Récupérer un utilisateur par ID
async function getUserById(userId) {
  return new Promise((resolve, reject) => {
    UserModel.getUserById(userId, (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

// Mettre à jour un utilisateur
async function updateUser(userId, updateData) {
  // Si le mot de passe est fourni, le hasher
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  // Adapter les données si nécessaire
  const adaptedData = { ...updateData };
  if (updateData.nom && updateData.prenom) {
    adaptedData.name = `${updateData.prenom} ${updateData.nom}`;
    delete adaptedData.nom;
    delete adaptedData.prenom;
  }

  return new Promise((resolve, reject) => {
    // Pour l'instant, on utilise une approche simple
    // TODO: Implémenter une méthode updateUser dans le modèle
    reject(new Error('Mise à jour utilisateur non implémentée'));
  });
}

// Supprimer un utilisateur
async function deleteUser(userId) {
  return new Promise((resolve, reject) => {
    UserModel.deleteUser(userId, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Récupérer tous les utilisateurs (pour admin)
async function getAllUsers() {
  return new Promise((resolve, reject) => {
    UserModel.getAllUsers((err, users) => {
      if (err) reject(err);
      else resolve(users);
    });
  });
}

// Vérifier si un utilisateur a un rôle spécifique
function hasRole(user, role) {
  // Correction : vérifier le champroleau lieu de 'type
  return user && user.role === role;
}

// Vérifier si un utilisateur peut accéder à une ressource
function canAccessResource(user, resourceOwnerId) {
  // Correction : autoriser administrateur via le champ 'role  return user && (user.id === resourceOwnerId || user.role === 'administrateur');
}

// Récupérer les utilisateurs en attente
async function getPendingUsers() {
  return new Promise((resolve, reject) => {
    UserModel.getPendingUsers((err, users) => {
      if (err) reject(err);
      else resolve(users);
    });
  });
}

// Valider un utilisateur
async function validateUser(userId) {
  return new Promise((resolve, reject) => {
    UserModel.updateUserValidationAndType(userId, 1, 'livreur', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Renvoyer un utilisateur en vérification
async function recheckUser(userId) {
  return new Promise((resolve, reject) => {
    UserModel.updateUserValidationAndType(userId, 0, 'client', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Mettre à jour le rôle d'un utilisateur
async function updateUserRole(userId, role) {
  if (!['membre', 'moderateur', 'administrateur'].includes(role)) {
    throw new Error('Rôle invalide');
  }
  return new Promise((resolve, reject) => {
    UserModel.updateUserRole(userId, role, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Récupérer les documents d'un utilisateur
async function getUserDocuments(userId) {
  return new Promise((resolve, reject) => {
    UserModel.getDocumentsByUserId(userId, (err, docs) => {
      if (err) reject(err);
      else resolve(docs || []);
    });
  });
}

module.exports = {
  validateRegistration,
  validateLogin,
  createUser,
  authenticateUser,
  generateToken,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  getPendingUsers,
  validateUser,
  recheckUser,
  updateUserRole,
  getUserDocuments,
  hasRole,
  canAccessResource
}; 