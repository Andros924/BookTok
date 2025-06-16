import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'library.db');

export const db = new sqlite3.Database(dbPath);

export const initDatabase = () => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT,
      year INTEGER,
      description TEXT,
      cover_image TEXT,
      pages INTEGER,
      language TEXT,
      publisher TEXT,
      genre TEXT,
      personal_notes TEXT,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      read_status TEXT DEFAULT 'to_read' CHECK(read_status IN ('to_read', 'reading', 'read')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('Database initialized successfully');
};