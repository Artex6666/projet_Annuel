const AnnonceModel = require('../models/annonceModel');
const path = require('path');
const fs = require('fs');

const TYPES_ANNONCES = [
  "Colis",
  "Service à la personne",
  "Transport de personne",
  "Courses",
  "Achat à l'étranger",
  "Garde d'animaux",
  "Petits travaux"
];

const canModifyAnnonce = (user, annonce) => {
  if (!user || !annonce) return false;
  const isAuthor = user.id === annonce.user_id;
  const hasRole = user.role === 'administrateur' || user.role === 'moderateur';
  return isAuthor || hasRole;
};

const AnnonceController = {
  getTypesAnnonces: (req, res) => {
    res.json({ types: TYPES_ANNONCES });
  },

  createAnnonce: (req, res, next) => {
    const user_id = req.user.id;
    const { titre, description, depart, arrivee, date, type, remuneration } = req.body;

    if (!titre || !description || !depart || !arrivee || !date || !type || !remuneration) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image obligatoire' });
    }

    if (!TYPES_ANNONCES.includes(type)) {
      return res.status(400).json({
        error: "Type d'annonce invalide",
        message: "Le type d'annonce doit être l'un des suivants : " + TYPES_ANNONCES.join(", ")
      });
    }

    const image = `/uploads/annonces/${user_id}/${req.file.filename}`;

    AnnonceModel.createAnnonce(
      { user_id, titre, description, depart, arrivee, date, type, remuneration, image },
      (err, annonce) => {
        if (err) return next(err);
        res.status(201).json(annonce);
      }
    );
  },

  getAllAnnonces: (req, res, next) => {
    AnnonceModel.getAllAnnonces((err, annonces) => {
      if (err) return next(err);
      res.json(annonces);
    });
  },

  getAnnoncesByUser: (req, res, next) => {
    const user_id = req.user.id;
    AnnonceModel.getAnnoncesByUser(user_id, (err, annonces) => {
      if (err) return next(err);
      res.json(annonces);
    });
  },

  getAnnonceById: (req, res, next) => {
    const id = req.params.id;
    AnnonceModel.getAnnonceById(id, (err, annonce) => {
      if (err) return next(err);
      if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });
      res.json(annonce);
    });
  },

  updateAnnonce: (req, res, next) => {
    const id = req.params.id;
    const user = req.user;

    AnnonceModel.getAnnonceById(id, (err, annonce) => {
      if (err) return next(err);
      if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });

      if (!canModifyAnnonce(user, annonce)) {
        return res.status(403).json({ 
          error: 'Non autorisé. Seul le créateur, un modérateur ou un administrateur peut modifier cette annonce.' 
        });
      }

      const { titre, description, depart, arrivee, date, type, remuneration, statut } = req.body;
      let image = annonce.image;

      if (req.file) {
        if (annonce.image) {
          const oldImagePath = path.join(__dirname, '../..', annonce.image);
          fs.unlink(oldImagePath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Erreur suppression image :', err);
            }
          });
        }
        image = `/uploads/annonces/${user.id}/${req.file.filename}`;
      }

      const updateData = {
        titre: titre || annonce.titre,
        description: description || annonce.description,
        depart: depart || annonce.depart,
        arrivee: arrivee || annonce.arrivee,
        date: date || annonce.date,
        type: type || annonce.type,
        remuneration: remuneration || annonce.remuneration,
        image,
        statut: statut || annonce.statut
      };

      AnnonceModel.updateAnnonce(id, updateData, (err2, updatedAnnonce) => {
        if (err2) return next(err2);
        res.json(updatedAnnonce);
      });
    });
  },

  deleteAnnonce: (req, res, next) => {
    const id = req.params.id;
    const user = req.user;

    AnnonceModel.getAnnonceById(id, (err, annonce) => {
      if (err) return next(err);
      if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });

      if (!canModifyAnnonce(user, annonce)) {
        return res.status(403).json({ 
          error: 'Non autorisé. Seul le créateur, un modérateur ou un administrateur peut supprimer cette annonce.' 
        });
      }

      if (annonce.image) {
        const imagePath = path.join(__dirname, '../..', annonce.image);
        fs.unlink(imagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Erreur suppression image :', err);
          }
        });
      }

      AnnonceModel.deleteAnnonce(id, (err2) => {
        if (err2) return next(err2);
        res.json({ message: 'Annonce supprimée avec succès' });
      });
    });
  },

  // ✅ Annonces disponibles pour les livreurs
  getAnnoncesDisponibles: (req, res, next) => {
    AnnonceModel.getAvailable((err, annonces) => {
      if (err) return next(err);
      res.json(annonces);
    });
  }
};

module.exports = AnnonceController;
