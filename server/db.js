import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'database', 'last-race.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) throw err;
});

db.run('PRAGMA foreign_keys = ON');

export default db;
