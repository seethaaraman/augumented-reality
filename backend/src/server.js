import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './services/seedDatabase.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.warn('⚠️ [Backend] Proceeding with server start despite DB warning:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Backend] Server listening on port ${PORT}`);
    console.log(`📍 [Backend] Local:    http://localhost:${PORT}`);
    console.log(`📍 [Backend] Health:   http://localhost:${PORT}/api/health`);
    console.log(`📍 [Backend] Menu DB:  http://localhost:${PORT}/api/menu`);
    console.log(`📍 [Backend] Orders:   http://localhost:${PORT}/api/orders`);
  });
}

// Only listen directly when running standalone (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
