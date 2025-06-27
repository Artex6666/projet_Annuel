const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const jwtAuth = require('../middleware/jwtAuth');
const roleAuth = require('../middleware/roleAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.params.id;
    const userDir = path.join(__dirname, '../../uploads', userId);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now();
    cb(null, base + '-' + unique + ext);
  }
});
const upload = multer({ storage });

router.get('/with-documents', jwtAuth, roleAuth, UserController.getUsersWithDocuments);

router.get('/pending', jwtAuth, roleAuth, UserController.getPendingUsers);

router.get('/validated', jwtAuth, roleAuth, UserController.getValidatedUsers);

router.get('/me', jwtAuth, (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ user: { id, name, email, role } });
});

// Routes d'authentification
router.post('/login', UserController.login);
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
  });
  res.json({ message: 'Déconnecté avec succès' });
});

// Routes avec paramètres
router.get('/:id', jwtAuth, roleAuth, UserController.getUser);

router.post('/', UserController.createUser);

router.post('/:id/validate', jwtAuth, roleAuth, UserController.validateUser);

router.delete('/:id', jwtAuth, roleAuth, UserController.deleteUser);

router.post('/:id/recheck', jwtAuth, roleAuth, UserController.recheckUser);

router.post('/:id/role', jwtAuth, roleAuth, UserController.updateUserRole);

router.get('/:id/documents', UserController.getUserDocuments);

router.post('/:id/documents', jwtAuth, upload.single('document'), UserController.uploadDocument);

module.exports = router;
