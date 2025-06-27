const db = require('./db');
const bcrypt = require('bcrypt');

const UserModel = {
  getAllUsers: (callback) => {
    db.all("SELECT * FROM users", callback);
  },
  getPendingUsers: (callback) => {
    db.all("SELECT * FROM users WHERE is_validated = 0", callback);
  },
  getValidatedUsers: (callback) => {
    db.all("SELECT * FROM users WHERE is_validated = 1", callback);
  },
  getUserById: (id, callback) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], callback);
  },
  createUser: async (user, callback) => {
    const { name, email, password, type } = user;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, type],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  },
  updateUserValidation: (id, isValidated, callback) => {
    db.run("UPDATE users SET is_validated = ? WHERE id = ?", [isValidated, id], callback);
  },
  updateUserValidationAndType: (id, isValidated, type, callback) => {
    db.run(
      "UPDATE users SET is_validated = ?, type = ? WHERE id = ?",
      [isValidated, type, id],
      callback
    );
  },
  deleteUser: (id, callback) => {
    db.run("DELETE FROM users WHERE id = ?", [id], callback);
  },
  updateUserRole: (id, role, callback) => {
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], callback);
  },
  getUserByEmail: (email, callback) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], callback);
  },
  verifyPassword: async (user, password) => {
    return await bcrypt.compare(password, user.password);
  },
  addDocument: (userId, document_name, document_url, callback) => {
    db.run(
      "INSERT INTO documents (user_id, document_name, document_url) VALUES (?, ?, ?)",
      [userId, document_name, document_url],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  },
  getDocumentsByUserId: (userId, callback) => {
    db.all("SELECT id, document_name, document_url FROM documents WHERE user_id = ?", [userId], callback);
  },
  getUsersWithDocuments: (callback) => {
    db.all(`
      SELECT DISTINCT d.user_id, u.id, u.name, u.email, u.type, u.is_validated, u.role
      FROM documents d
      INNER JOIN users u ON d.user_id = u.id
    `, callback);
  }
};

module.exports = UserModel;
