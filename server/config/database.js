const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database', 'database.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let database;

// Initialize database connection
function getDatabase() {
    if (!database) {
        database = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
            }
        });
        database.run('PRAGMA foreign_keys = ON');
    }
    return database;
}

// Database schema
const schema = `
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

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
  );
`;

// Default categories
const defaultCategories = [
    {
        name: 'Einkaufen & Sparen',
        slug: 'shopping',
        description: 'Preisvergleiche und Spartipps',
        system_prompt: 'Du bist ein Experte für Preisvergleiche und Spartipps.',
        icon: '🛒'
    },
    {
        name: 'Fitness & Ernährung',
        slug: 'fitness',
        description: 'Trainings- und Ernährungspläne',
        system_prompt: 'Du bist ein Fitness- und Ernährungsberater.',
        icon: '💪'
    }
];

// Initialize database
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error creating schema:', err);
                reject(err);
                return;
            }

            // Insert default categories
            const stmt = db.prepare(`
        INSERT OR IGNORE INTO categories (name, slug, description, system_prompt, icon)
        VALUES (?, ?, ?, ?, ?)
      `);

            defaultCategories.forEach((category) => {
                stmt.run([category.name, category.slug, category.description, category.system_prompt, category.icon]);
            });

            stmt.finalize();
            console.log('Database initialized successfully');
            resolve();
        });
    });
}

// Database utility functions
const dbUtils = {
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
            getDatabase().run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
};

module.exports = {
    initializeDatabase,
    getDatabase,
    db: dbUtils
};