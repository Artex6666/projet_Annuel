const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceController');
const jwtAuth = require('../middleware/jwtAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GeocodeCacheModel = require('../models/geocodeCache');

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

// Route proxy pour l'API Nominatim avec cache en base et recherche partielle
router.get('/geocode', async (req, res) => {
  try {
    const { q, countrycodes, limit = 5 } = req.query;
    if (!q || q.length < 3) {
      return res.json([]);
    }
    const normalizedQuery = q.toLowerCase().trim();
    const cacheKey = `${normalizedQuery}_${countrycodes || 'all'}_${limit}`;

    // 1. Vérifier le cache exact d'abord
    GeocodeCacheModel.get(cacheKey, (err, cachedResult) => {
      if (err) {
        console.error('Erreur cache:', err);
      } else if (cachedResult && cachedResult.length > 0) {
        return res.json(cachedResult);
      }
      // 2. Recherche partielle dans le cache
      GeocodeCacheModel.searchPartial(normalizedQuery, (err, partialResults) => {
        if (err) {
          console.error('Erreur recherche partielle:', err);
        } else if (partialResults && partialResults.length > 0) {
          return res.json(partialResults.slice(0, limit));
        }
        // 3. Si pas en cache, faire la requête Nominatim
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=1`;
        if (countrycodes) url += `&countrycodes=${countrycodes}`;
        fetch(url, {
          headers: {
            'User-Agent': 'EcoDeli/1.0 (https://ecodeli.com; contact@ecodeli.com)'
          }
        })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          GeocodeCacheModel.set(cacheKey, data, (err) => {
            if (err) console.error('Erreur sauvegarde cache:', err);
          });
          res.json(data);
        })
        .catch(error => {
          console.error('Erreur proxy geocoding:', error);
          res.status(500).json({ error: "Erreur lors de la recherche d'adresse" });
        });
      });
    });
  } catch (error) {
    console.error('Erreur proxy geocoding:', error);
    res.status(500).json({ error: "Erreur lors de la recherche d'adresse" });
  }
});

// Routes d'annonces classiques
router.post('/', jwtAuth, upload.single('image'), annonceController.createAnnonce);
router.get('/', annonceController.getAllAnnonces);
router.get('/mes', jwtAuth, annonceController.getAnnoncesByUser);
router.get('/types', annonceController.getTypesAnnonces);
router.get('/disponibles', annonceController.getAnnoncesDisponibles);
router.get('/:id', annonceController.getAnnonceById);
router.put('/:id', jwtAuth, upload.single('image'), annonceController.updateAnnonce);
router.delete('/:id', jwtAuth, annonceController.deleteAnnonce);

module.exports = router; 