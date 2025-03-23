const db = require('../models/db'); 

const DashboardController = {
  getStats: async (req, res) => {
    try {

      const clientsRow = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) AS total FROM users WHERE type = 'client'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });


      const prestatairesRow = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) AS total FROM users WHERE type = 'prestataire'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      const colis24h = 42;

      res.json({
        clients: clientsRow.total,
        prestataires: prestatairesRow.total,
        colisLivres: colis24h
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
    }
  }
};

module.exports = DashboardController;
