const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connexion à la base de données
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  } else {
    console.log('Connecté à la base de données SQLite');
  }
});

// Fonction pour vérifier si une colonne existe
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const exists = rows.some(row => row.name === columnName);
        resolve(exists);
      }
    });
  });
}

// Fonction pour ajouter une colonne si elle n'existe pas
async function addColumnIfNotExists(tableName, columnName, columnType, defaultValue = null) {
  try {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}${defaultValue ? ' DEFAULT ' + defaultValue : ''}`;
      return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Colonne ${columnName} ajoutée à la table ${tableName}`);
            resolve();
          }
        });
      });
    } else {
      console.log(`ℹ️  Colonne ${columnName} existe déjà dans la table ${tableName}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'ajout de la colonne ${columnName} à la table ${tableName}:`, error);
  }
}

// Fonction principale de mise à jour
async function updateDatabase() {
  console.log('🔄 Mise à jour de la base de données...');
  
  try {
    // Mise à jour de la table annonces
    await addColumnIfNotExists('annonces', 'livraison_partielle', 'INTEGER', '0');
    await addColumnIfNotExists('annonces', 'current_location', 'TEXT');
    await addColumnIfNotExists('annonces', 'depart_lat', 'REAL');
    await addColumnIfNotExists('annonces', 'depart_lng', 'REAL');
    await addColumnIfNotExists('annonces', 'arrivee_lat', 'REAL');
    await addColumnIfNotExists('annonces', 'arrivee_lng', 'REAL');
    
    // Mise à jour de la table livraisons
    await addColumnIfNotExists('livraisons', 'depart_livraison', 'TEXT');
    await addColumnIfNotExists('livraisons', 'arrivee_livraison', 'TEXT');
    await addColumnIfNotExists('livraisons', 'depart_lat', 'REAL');
    await addColumnIfNotExists('livraisons', 'depart_lng', 'REAL');
    await addColumnIfNotExists('livraisons', 'arrivee_lat', 'REAL');
    await addColumnIfNotExists('livraisons', 'arrivee_lng', 'REAL');
    await addColumnIfNotExists('livraisons', 'progress_percentage', 'REAL', '0');
    
    // Mettre à jour les annonces existantes avec current_location = depart si null
    await new Promise((resolve, reject) => {
      db.run(`UPDATE annonces SET current_location = depart WHERE current_location IS NULL`, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Mise à jour des current_location pour les annonces existantes');
          resolve();
        }
      });
    });
    
    // Mettre à jour les livraisons existantes avec les adresses par défaut
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE livraisons 
        SET depart_livraison = (SELECT depart FROM annonces WHERE annonces.id = livraisons.annonce_id),
            arrivee_livraison = (SELECT arrivee FROM annonces WHERE annonces.id = livraisons.annonce_id),
            progress_percentage = 100
        WHERE depart_livraison IS NULL
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Mise à jour des livraisons existantes avec adresses par défaut');
          resolve();
        }
      });
    });
    
    console.log('🎉 Mise à jour de la base de données terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la base de données:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la base de données:', err);
      } else {
        console.log('Base de données fermée');
      }
    });
  }
}

// Exécuter la mise à jour
updateDatabase(); 