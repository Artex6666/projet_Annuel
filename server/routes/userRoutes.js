const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

router.get('/pending', UserController.getPendingUsers);

router.get('/validated', UserController.getValidatedUsers);

router.get('/:id', UserController.getUser);

router.post('/', UserController.createUser);

router.post('/:id/validate', UserController.validateUser);

router.delete('/:id', UserController.deleteUser);

router.post('/:id/recheck', UserController.recheckUser);

router.post('/:id/role', UserController.updateUserRole);

router.get('/:id/documents', UserController.getUserDocuments);

module.exports = router;
