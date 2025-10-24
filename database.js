const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use /app/data in Docker, or current directory in development
const dbDir = process.env.NODE_ENV === 'production' ? '/app/data' : '.';
const dbPath = path.join(dbDir, 'database.db');

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create tables if they don't exist
const createTables = () => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;

  const groupsTable = `
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `;
  
  const supplicationsTable = `
    CREATE TABLE IF NOT EXISTS supplications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        title TEXT,
        text TEXT NOT NULL,
        target INTEGER NOT NULL,
        currentCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    );
  `;

  db.exec(usersTable);
  db.exec(groupsTable);
  db.exec(supplicationsTable);

  // Migration: Add title column to existing tables if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(supplications)").all();
    const hasTitle = tableInfo.some(col => col.name === 'title');

    if (!hasTitle) {
      console.log('Adding title column to supplications table...');
      db.exec('ALTER TABLE supplications ADD COLUMN title TEXT');
      console.log('Title column added successfully');
    }
  } catch (error) {
    console.error('Error checking/adding title column:', error);
  }
};

createTables();

console.log(`Database initialized at: ${dbPath}`);

module.exports = db;