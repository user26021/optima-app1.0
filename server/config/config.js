const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const dbPath = path.join(__dirname, '../database', 'database.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

// Initialize database connection
function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

// Database schema
const schema = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    preferences TEXT,
    is_premium BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_premium BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Chat sessions table
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );

  -- Chat messages table
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
  );

  -- User favorites table
  CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  -- Uploaded files table
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    processed BOOLEAN DEFAULT 0,
    ocr_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
`;

// Default categories data
const defaultCategories = [
  {
    name: 'Einkaufen & Sparen',
    slug: 'shopping',
    description: 'Preisvergleiche, Angebote und Spartipps für den täglichen Einkauf',
    system_prompt: `Du bist ein Experte für Preisvergleiche und Spartipps. Deine Aufgabe ist es, Nutzern beim Sparen zu helfen durch:

1. Aktuelle Preisvergleiche für Produkte
2. Angebote und Rabatte finden
3. Analyse von Kassenbons für Einsparpotentiale
4. Einkaufslisten optimieren
5. Günstige Alternativen vorschlagen

Sei immer hilfreich, konkret und fokussiert auf Kostenersparnis. Frage nach dem Standort des Nutzers für lokale Angebote. Gib spezifische Preise, Geschäfte und Verfügbarkeiten an, wenn möglich.`,
    icon: '🛒'
  },
  {
    name: 'Fitness & Ernährung',
    slug: 'fitness',
    description: 'Individuelle Trainings- und Ernährungspläne für deine Gesundheitsziele',
    system_prompt: `Du bist ein qualifizierter Fitness- und Ernährungsberater. Deine Aufgabe ist es, individuelle und wissenschaftlich fundierte Beratung zu geben:

1. Personalisierte Trainingspläne erstellen
2. Ausgewogene Ernährungspläne entwickeln
3. Fortschritte verfolgen und anpassen
4. Motivation und Tipps für den Alltag
5. Gesunde Rezepte und Meal-Prep Ideen

Frage immer nach: Alter, Geschlecht, Fitness-Level, Zielen, verfügbarer Zeit, Equipment und Ernährungsvorlieben. Erstelle konkrete, umsetzbare Pläne die als PDF exportiert werden können.`,
    icon: '💪'
  }
];

// Initialize database with schema and default data
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    database.exec(schema, (err) => {
      if (err) {
        console.error('Error creating database schema:', err);
        reject(err);
        return;
      }
      
      console.log('Database schema created successfully');
      
      // Insert default categories
      insertDefaultCategories(database)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

// Insert default categories if they don't exist
function insertDefaultCategories(database) {
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT OR IGNORE INTO categories (name, slug, description, system_prompt, icon)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    let completed = 0;
    
    defaultCategories.forEach((category) => {
      stmt.run([
        category.name,
        category.slug,
        category.description,
        category.system_prompt,
        category.icon
      ], (err) => {
        if (err) {
          console.error('Error inserting category:', err);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === defaultCategories.length) {
          stmt.finalize();
          console.log('Default categories inserted successfully');
          resolve();
        }
      });
    });
  });
}

// Database utility functions
const db = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      getDatabase().run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  db
};