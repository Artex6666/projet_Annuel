const db = require('./db');

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
  createUser: (user, callback) => {
    const { name, email, type } = user;
    db.run(
      "INSERT INTO users (name, email, type) VALUES (?, ?, ?)",
      [name, email, type],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  },
  updateUserValidation: (id, isValidated, callback) => {
    db.run("UPDATE users SET is_validated = ? WHERE id = ?", [isValidated, id], callback);
  },
  deleteUser: (id, callback) => {
    db.run("DELETE FROM users WHERE id = ?", [id], callback);
  },
  updateUserRole: (id, role, callback) => {
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], callback);
  }
};

module.exports = UserModel;
