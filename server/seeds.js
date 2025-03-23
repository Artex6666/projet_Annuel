// seed.js
const db = require('./models/db');

const users = [
  { name: "Alice Dupont", email: "alice@example.com", type: "client", is_validated: 1, role: "membre" },
  { name: "Bob Martin", email: "bob@example.com", type: "livreur", is_validated: 0, role: "membre" },
  { name: "Caroline Leroy", email: "caroline@example.com", type: "prestataire", is_validated: 1, role: "moderateur" },
  { name: "David Durand", email: "david@example.com", type: "client", is_validated: 0, role: "membre" },
  { name: "Evelyne Bernard", email: "evelyne@example.com", type: "livreur", is_validated: 1, role: "membre" },
  { name: "François Petit", email: "francois@example.com", type: "prestataire", is_validated: 1, role: "administrateur" },
  { name: "Gina Moreau", email: "gina@example.com", type: "client", is_validated: 0, role: "membre" },
  { name: "Hugo Lefevre", email: "hugo@example.com", type: "livreur", is_validated: 1, role: "membre" },
  { name: "Isabelle Marchand", email: "isabelle@example.com", type: "prestataire", is_validated: 0, role: "membre" },
  { name: "Julien Roche", email: "julien@example.com", type: "client", is_validated: 1, role: "moderateur" }
];

const insertUser = (user) => {
  return new Promise((resolve, reject) => {
    const { name, email, type, is_validated, role } = user;
    db.run(
      "INSERT INTO users (name, email, type, is_validated, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, type, is_validated, role],
      function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID);
      }
    );
  });
};

async function seedUsers() {
  try {
    for (const user of users) {
      const id = await insertUser(user);
      console.log(`Utilisateur ${user.name} inséré avec l'ID ${id}`);
    }
    console.log("Seed terminée !");
    process.exit(0);
  } catch (err) {
    console.error("Erreur lors du seed: ", err);
    process.exit(1);
  }
}

seedUsers();
