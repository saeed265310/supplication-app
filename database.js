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
        text TEXT NOT NULL,
        target INTEGER NOT NULL,
        currentCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    );
  `;

  db.exec(usersTable);
  db.exec(groupsTable);
  db.exec(supplicationsTable);
};

createTables();

console.log(`Database initialized at: ${dbPath}`);

module.exports = db;