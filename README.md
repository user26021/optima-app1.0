// Client/src/index.js - React Einstiegspunkt
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ===================================

// Client/public/index.html
`<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Optima - KI-gestützte Beratungs-App für Alltag, Einkaufen und Fitness" />
    <title>Optima - Smart Assistant</title>
  </head>
  <body>
    <noscript>Sie müssen JavaScript aktivieren, um diese App auszuführen.</noscript>
    <div id="root"></div>
  </body>
</html>`

// ===================================

// Server/scripts/setupDatabase.js - Datenbank-Setup Script
const { initializeDatabase } = require('../config/database');
const logger = require('../utils/logger');

async function setupDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();

// ===================================

// Server/.env.example - Environment Variables Example
`# Environment
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=optima-super-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Database (SQLite für Development)
DATABASE_PATH=./database/database.db

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info`

// ===================================

// Client/.env.example
`REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development`

// ===================================

// .gitignore - Root
`# Dependencies
node_modules/
*/node_modules/

# Production builds
client/build/
server/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
server/database/*.db
server/database/*.db-journal

# Logs
server/logs/
*.log

# Uploads and temp files
server/uploads/
server/temp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Runtime files
*.pid
*.seed
*.pid.lock

# Coverage reports
coverage/
.nyc_output

# Dependency directories
jspm_packages/

# npm
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo

# Optional cache directories
.cache/
.parcel-cache/`

// ===================================

// README.md - Hauptdokumentation
`# Optima App

Eine KI-gestützte Beratungs-App für Alltag, Einkaufen und Fitness.

## ✨ Features

- **🛒 Smart Shopping:** Preisvergleiche, Kassenbon-Analyse, Spartipps
- **💪 Fitness & Ernährung:** Individuelle Trainings- und Ernährungspläne
- **🤖 KI-Beratung:** Intelligente, kategoriebasierte Beratung
- **📄 PDF-Export:** Alle Pläne als PDF exportierbar
- **📱 Responsive Design:** Funktioniert auf allen Geräten

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 16+ 
- npm 8+
- OpenAI API Key

### Installation
\`\`\`bash
# Repository klonen
git clone <repository-url>
cd optima-app

# Alle Dependencies installieren
npm run install-all

# Environment-Dateien erstellen
cp server/.env.example server/.env
cp client/.env.example client/.env

# OpenAI API Key in server/.env eintragen
# OPENAI_API_KEY=sk-your-key-here

# Datenbank initialisieren
cd server && npm run setup-db

# Entwicklungsserver starten
cd .. && npm run dev
\`\`\`

Die App ist dann verfügbar unter:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📚 Dokumentation

- [Setup-Anleitung](docs/SETUP.md) - Detaillierte Installationsanweisungen
- [API-Dokumentation](docs/API.md) - REST API Referenz
- [System-Prompts](docs/PROMPTS.md) - KI-Konfiguration
- [Deployment](docs/DEPLOYMENT.md) - Produktions-Deployment

## 🏗️ Architektur

### Frontend (React)
- React 18 mit Hooks
- Zustand State Management
- React Router für Navigation
- Axios für API-Calls
- React Hot Toast für Notifications

### Backend (Node.js/Express)
- Express.js Server
- SQLite Datenbank (Development)
- OpenAI API Integration
- JWT Authentication
- Multer für File Uploads
- Tesseract.js für OCR
- Puppeteer für PDF Generation

### KI-Integration
- OpenAI GPT-3.5-Turbo
- Kategoriebasierte System-Prompts
- Kontextuelle Benutzerdata
- Strukturierte Plan-Generierung

## 🔧 Entwicklung

### Projekt-Struktur
\`\`\`
optima-app/
├── client/          # React Frontend
├── server/          # Node.js Backend
├── docs/           # Dokumentation
└── package.json    # Root Scripts
\`\`\`

### Verfügbare Scripts
\`\`\`bash
npm run dev          # Entwicklungsserver (Frontend + Backend)
npm run server       # Nur Backend
npm run client       # Nur Frontend
npm run build        # Produktions-Build
npm run install-all  # Alle Dependencies installieren
\`\`\`

### Neue Kategorien hinzufügen
1. Kategorie in Datenbank einfügen
2. System-Prompt definieren
3. Frontend-Icon und Styling hinzufügen
4. API-Logic erweitern

## 🚀 Deployment

### Empfohlene Hosting-Plattformen
- **Frontend:** Vercel, Netlify
- **Backend:** Railway, Heroku, AWS
- **Datenbank:** PostgreSQL für Produktion

### Umgebungsvariablen für Produktion
Siehe \`docs/DEPLOYMENT.md\` für detaillierte Anweisungen.

## 🔒 Sicherheit

- JWT-basierte Authentifizierung
- Rate Limiting für API-Endpunkte
- File-Upload-Validierung
- CORS-Konfiguration
- Input-Sanitization
- DSGVO-konforme Datenspeicherung

## 📱 Mobile Support

Die App ist vollständig responsive und funktioniert auf:
- Desktop (Chrome, Firefox, Safari, Edge)
- Tablet (iPad, Android Tablets)
- Mobile (iOS Safari, Android Chrome)

## 🛡️ DSGVO & Datenschutz

- Nutzer können Daten jederzeit löschen
- Minimale Datenspeicherung
- Transparente Datenverwendung
- Opt-in für alle Features
- Keine Tracking-Cookies

## 📊 Analytics & Monitoring

### Verfügbare Metriken
- API-Response-Zeiten
- Fehlerrate
- Benutzeraktivität
- OpenAI Token-Usage

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (\`git checkout -b feature/AmazingFeature\`)
3. Änderungen committen (\`git commit -m 'Add AmazingFeature'\`)
4. Branch pushen (\`git push origin feature/AmazingFeature\`)
5. Pull Request öffnen

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz.

## 💰 Monetarisierung

### Freemium-Modell
- **Kostenlos:** Basis-Kategorien, limitierte API-Calls
- **Premium (0,99€/Monat):** Alle Kategorien, unbegrenzte Features

### Premium-Features
- Alle Kategorien verfügbar
- Unbegrenzte PDF-Exports
- Prioritäts-Support
- Erweiterte Analysen

## 🆘 Support

Bei Fragen oder Problemen:

1. Prüfen Sie die [Dokumentation](docs/)
2. Schauen Sie in die [Issues](../../issues)
3. Erstellen Sie ein neues Issue mit:
   - Beschreibung des Problems
   - Schritte zur Reproduktion
   - Environment-Informationen

## 🔮 Roadmap

### Phase 1 (MVP) ✅
- Basis-Kategorien (Shopping, Fitness)
- KI-Chat-Interface
- PDF-Export
- Benutzer-Authentifizierung

### Phase 2 (Q2 2024)
- [ ] Weitere Kategorien (Reisen, Finanzen)
- [ ] Mobile App (React Native)
- [ ] Push-Benachrichtigungen
- [ ] Social Features

### Phase 3 (Q3 2024)
- [ ] API für Drittanbieter
- [ ] White-Label-Lösung
- [ ] Enterprise-Features
- [ ] Multi-Language-Support

---

**Erstellt mit ❤️ für bessere Alltagsentscheidungen**`

// ===================================

// package.json - Root Package.json (Final)
{
  "name": "optima-app",
  "version": "1.0.0",
  "description": "KI-gestützte Beratungs-App für Alltag, Einkaufen und Fitness",
  "main": "server/index.js",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "install-all": "npm install && cd server && npm install && cd ../client && npm install",
    "setup": "npm run install-all && cd server && npm run setup-db",
    "start": "cd server && npm start",
    "test": "cd server && npm test && cd ../client && npm test",
    "clean": "rm -rf node_modules server/node_modules client/node_modules",
    "reset": "npm run clean && npm run setup"
  },
  "keywords": [
    "ai",
    "assistant",
    "shopping",
    "fitness",
    "price-comparison",
    "chatbot",
    "react",
    "nodejs",
    "openai"
  ],
  "author": "Optima Team",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/optima-app.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/optima-app/issues"
  },
  "homepage": "https://optima-app.com"
}#   o p t i m a - a p p  
 #   o p t i m a - a p p  
 #   o p t i m a - a p p  
 