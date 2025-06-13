const { initializeDatabase } = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🗄️  Initializing database...');
    await initializeDatabase();
    console.log('✅ Database setup completed successfully!');
    console.log('🎯 You can now start the server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('📋 Make sure you have all dependencies installed: npm install');
    process.exit(1);
  }
}

setupDatabase();