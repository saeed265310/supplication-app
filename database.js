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

  const countHistoryTable = `
    CREATE TABLE IF NOT EXISTS count_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        supplication_id INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
        FOREIGN KEY (supplication_id) REFERENCES supplications (id) ON DELETE CASCADE
    );
  `;

  const userSettingsTable = `
    CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        notifications_enabled INTEGER NOT NULL DEFAULT 0,
        theme TEXT NOT NULL DEFAULT 'auto',
        default_font_size TEXT NOT NULL DEFAULT '2xs',
        default_font_weight TEXT NOT NULL DEFAULT 'bold',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `;

  const reminderTimesTable = `
    CREATE TABLE IF NOT EXISTS reminder_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `;

  // Create index for faster queries on count_history
  const countHistoryIndex = `
    CREATE INDEX IF NOT EXISTS idx_count_history_user_timestamp
    ON count_history(user_id, timestamp);
  `;

  db.exec(usersTable);
  db.exec(groupsTable);
  db.exec(supplicationsTable);
  db.exec(countHistoryTable);
  db.exec(userSettingsTable);
  db.exec(reminderTimesTable);
  db.exec(countHistoryIndex);

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

  // Migration: Add position column to existing tables if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(supplications)").all();
    const hasPosition = tableInfo.some(col => col.name === 'position');

    if (!hasPosition) {
      console.log('Adding position column to supplications table...');
      db.exec('ALTER TABLE supplications ADD COLUMN position INTEGER DEFAULT 0');
      console.log('Position column added successfully');

      // Update existing supplications to have sequential positions within their groups
      console.log('Setting positions for existing supplications...');
      const groups = db.prepare('SELECT DISTINCT group_id FROM supplications').all();
      for (const { group_id } of groups) {
        const supplications = db.prepare('SELECT id FROM supplications WHERE group_id = ? ORDER BY id').all(group_id);
        const updateStmt = db.prepare('UPDATE supplications SET position = ? WHERE id = ?');
        supplications.forEach((sup, index) => {
          updateStmt.run(index, sup.id);
        });
      }
      console.log('Positions set successfully');
    }
  } catch (error) {
    console.error('Error checking/adding position column:', error);
  }
};

createTables();

console.log(`Database initialized at: ${dbPath}`);

module.exports = db;