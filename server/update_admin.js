const bcrypt = require('bcrypt');
const db = require('./models/db');

async function updateAdminPassword() {
  try {
    const newPassword = 'azerty';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('Hash généré pour "azerty":', hashedPassword);
    
    db.run(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, 'admin@admin.com'],
      function(err) {
        if (err) {
          console.error('Erreur lors de la mise à jour:', err);
          process.exit(1);
        }
        
        if (this.changes > 0) {
          console.log('✅ Mot de passe mis à jour avec succès pour admin@admin.com');
          console.log('Nouveau mot de passe: azerty');
        } else {
          console.log('❌ Aucun utilisateur trouvé avec l\'email admin@admin.com');
        }
        
        db.close();
        process.exit(0);
      }
    );
    
  } catch (error) {
    console.error('Erreur lors du hashage:', error);
    process.exit(1);
  }
}

updateAdminPassword();