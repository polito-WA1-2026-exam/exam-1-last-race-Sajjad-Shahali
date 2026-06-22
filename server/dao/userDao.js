import db from '../db.js';
import crypto from 'crypto';

export function getUserByCredentials(username, password) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(false);

      const user = { id: row.id, username: row.username, display_name: row.display_name };
      crypto.scrypt(password, row.salt, 32, (err, hash) => {
        if (err) return reject(err);
        if (!crypto.timingSafeEqual(Buffer.from(row.password_hash, 'hex'), hash))
          return resolve(false);
        resolve(user);
      });
    });
  });
}
