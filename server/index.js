+ const authRoutes = require('./routes/auth');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Simple logger
const logger = {
  info: (message) => console.log('INFO:', message),
  error: (message, data) => console.error('ERROR:', message, data),
  warn: (message) => console.warn('WARN:', message)
};

// Mock database
let users = [];
let sessions = [];
let messages = [];
let sessionIdCounter = 1;
let messageIdCounter = 1;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
+ app.use('/api/auth', authRoutes);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth middleware (simplified)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token === 'null') {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Mock user from token
  req.user = { id: 1, name: 'Test User', email: 'test@test.de', is_premium: false };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Optima Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  const user = { id: users.length + 1, name, email, is_premium: false };
  users.push(user);
  
  res.json({
    success: true,
    message: 'User registered successfully',
    user: user,
    token: 'mock-jwt-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    message: 'Login successful',
    user: { id: 1, name: 'Test User', email, is_premium: false },
    token: 'mock-jwt-token'
  });
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Categories
app.get('/api/categories', authMiddleware, (req, res) => {
  res.json({
    success: true,
    categories: [
      {
        id: 1,
        name: 'Einkaufen & Sparen',
        slug: 'shopping',
        description: 'Preisvergleiche, Angebote und Spartipps für den täglichen Einkauf',
        icon: '🛒',
        is_premium: false
      },
      {
        id: 2,
        name: 'Fitness & Ernährung',
        slug: 'fitness', 
        description: 'Individuelle Trainings- und Ernährungspläne für deine Gesundheitsziele',
        icon: '💪',
        is_premium: false
      }
    ]
  });
});

// Chat sessions
app.post('/api/chat/sessions', authMiddleware, (req, res) => {
  const { categorySlug, title } = req.body;
  
  const session = {
    id: sessionIdCounter++,
    title: title || `${categorySlug} Chat`,
    category: {
      name: categorySlug === 'shopping' ? 'Einkaufen & Sparen' : 'Fitness & Ernährung',
      slug: categorySlug
    },
    created_at: new Date().toISOString()
  };
  
  sessions.push(session);
  
  res.status(201).json({
    success: true,
    session: session
  });
});

app.get('/api/chat/sessions', authMiddleware, (req, res) => {
  const userSessions = sessions.map(session => ({
    ...session,
    message_count: messages.filter(m => m.session_id === session.id).length,
    updated_at: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    sessions: userSessions
  });
});

app.get('/api/chat/sessions/:sessionId', authMiddleware, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const sessionMessages = messages.filter(m => m.session_id === sessionId);
  
  res.json({
    success: true,
    session: {
      ...session,
      messages: sessionMessages
    }
  });
});

// Chat messages
app.post('/api/chat/message', authMiddleware, (req, res) => {
  const { sessionId, content } = req.body;
  
  // User message
  const userMessage = {
    id: messageIdCounter++,
    session_id: sessionId,
    role: 'user',
    content: content,
    created_at: new Date().toISOString()
  };
  
  messages.push(userMessage);
  
  // Mock AI response
  let aiResponse = '';
  const session = sessions.find(s => s.id === sessionId);
  
  if (session?.category.slug === 'shopping') {
    aiResponse = `Gerne helfe ich Ihnen beim Sparen! Für "${content}" kann ich folgende Tipps geben:

🛒 **Preisvergleich-Tipps:**
- Vergleichen Sie Preise bei REWE, EDEKA, ALDI und Lidl
- Nutzen Sie Apps wie "KaufDa" für aktuelle Prospekte
- Achten Sie auf Eigenmarken - oft 30-50% günstiger

💰 **Spartipps:**
- Einkaufsliste erstellen und daran halten
- Nie hungrig einkaufen gehen
- Bulk-Käufe bei länger haltbaren Produkten

Haben Sie ein spezifisches Produkt, für das ich Preise vergleichen soll?`;
  } else {
    aiResponse = `Perfekt! Ich helfe Ihnen gerne bei Fitness und Ernährung. Zu "${content}" kann ich sagen:

💪 **Fitness-Tipps:**
- Starten Sie mit 2-3 Trainingseinheiten pro Woche
- Kombinieren Sie Kraft- und Ausdauertraining
- Geben Sie Ihrem Körper ausreichend Regenerationszeit

🥗 **Ernährungs-Tipps:**
- Ausgewogene Makronährstoffe: Protein, Kohlenhydrate, Fette
- Viel Gemüse und Obst (5 Portionen täglich)
- Ausreichend Wasser trinken (2-3 Liter täglich)

Soll ich Ihnen einen personalisierten Trainings- oder Ernährungsplan erstellen?`;
  }
  
  const assistantMessage = {
    id: messageIdCounter++,
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
    created_at: new Date().toISOString()
  };
  
  messages.push(assistantMessage);
  
  res.json({
    success: true,
    messages: [userMessage, assistantMessage]
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Optima Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🎯 Ready for testing!`);
});

module.exports = app;
