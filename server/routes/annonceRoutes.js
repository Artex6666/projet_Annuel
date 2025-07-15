const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceController');
const jwtAuth = require('../middleware/jwtAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.id;
    const dir = path.join(__dirname, '../../uploads/annonces', String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now();
    cb(null, base + '-' + unique + ext);
  }
});
const upload = multer({ storage });

// ✅ Routes d'annonces
router.post('/', jwtAuth, upload.single('image'), annonceController.createAnnonce);
router.get('/', annonceController.getAllAnnonces);
router.get('/mes', jwtAuth, annonceController.getAnnoncesByUser);
router.get('/types', annonceController.getTypesAnnonces);

// ✅ NOUVELLE route : annonces dispo pour livreurs
router.get('/disponibles', annonceController.getAnnoncesDisponibles);

router.get('/:id', annonceController.getAnnonceById);
router.put('/:id', jwtAuth, upload.single('image'), annonceController.updateAnnonce);
router.delete('/:id', jwtAuth, annonceController.deleteAnnonce);

module.exports = router;
