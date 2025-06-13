+ const express = require('express');
+ const router = express.Router();
+ const bcrypt = require('bcrypt');
+ const jwt = require('jsonwebtoken');
+ const db = require('../db'); // SQLite-Verbindung

+ // Stelle sicher, dass die Tabelle existiert:
+ db.run(`
+   CREATE TABLE IF NOT EXISTS users (
+     id INTEGER PRIMARY KEY AUTOINCREMENT,
+     username TEXT UNIQUE,
+     password TEXT
+   );
+ `);

+ // Registrierung
+ router.post('/register', async (req, res) => {
+   const { username, password } = req.body;
+   if (!username || !password) return res.status(400).json({ message: 'Username und Passwort erforderlich.' });
+   try {
+     const hash = await bcrypt.hash(password, 10);
+     const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
+     await stmt.run(username, hash);
+     stmt.finalize();
+     res.status(201).json({ message: 'Registrierung erfolgreich.' });
+   } catch (err) {
+     if (err.code === 'SQLITE_CONSTRAINT') {
+       return res.status(409).json({ message: 'Nutzername bereits vergeben.' });
+     }
+     console.error(err);
+     res.status(500).json({ message: 'Serverfehler.' });
+   }
+ });

+ // Login
+ router.post('/login', async (req, res) => {
+   const { username, password } = req.body;
+   if (!username || !password) return res.status(400).json({ message: 'Username und Passwort erforderlich.' });
+   try {
+     const user = await db.get('SELECT * FROM users WHERE username = ?', username);
+     if (!user) return res.status(401).json({ message: 'Ungültige Zugangsdaten.' });
+     const match = await bcrypt.compare(password, user.password);
+     if (!match) return res.status(401).json({ message: 'Ungültige Zugangsdaten.' });
+     const token = jwt.sign(
+       { id: user.id, username },
+       process.env.JWT_SECRET || 'secret',
+       { expiresIn: '1h' }
+     );
+     res.json({ token, username });
+   } catch (err) {
+     console.error(err);
+     res.status(500).json({ message: 'Serverfehler.' });
+   }
+ });

+ module.exports = router;
