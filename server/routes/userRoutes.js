const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');
const roleAuth = require('../middleware/roleAuth');
const UserController = require('../controllers/userController');

// Routes publiques
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);

// Routes protégées
router.get('/me', jwtAuth, UserController.getMe);

// Routes admin - IMPORTANT: Les routes spécifiques AVANT les routes avec paramètres
router.get('/pending/users', jwtAuth, roleAuth(['administrateur']), UserController.getPendingUsers);
router.get('/', jwtAuth, roleAuth(['administrateur']), UserController.getAllUsers);
router.get('/:id/documents', jwtAuth, roleAuth(['administrateur']), UserController.getUserDocuments);
router.get('/:id', jwtAuth, UserController.getUserById);
router.put('/:id', jwtAuth, UserController.updateUser);
router.delete('/:id', jwtAuth, roleAuth(['administrateur']), UserController.deleteUser);
router.post('/:id/validate', jwtAuth, roleAuth(['administrateur']), UserController.validateUser);
router.post('/:id/recheck', jwtAuth, roleAuth(['administrateur']), UserController.recheckUser);
router.post('/:id/role', jwtAuth, roleAuth(['administrateur']), UserController.updateUserRole);

module.exports = router;
