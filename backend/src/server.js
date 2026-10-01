import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './services/seedDatabase.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import scanRoutes from './routes/scanRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static 3D models from backend/models
const modelsPath = path.resolve(__dirname, '../models');
app.use('/models', express.static(modelsPath));

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/scan', scanRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  res.status(200).json({
    status: 'ONLINE',
    service: 'AR Restaurant Backend API',
    database: {
      provider: 'MongoDB',
      status: dbStatus,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none'
    },
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.send('🍛 AR Restaurant Backend API with MongoDB is running. Access endpoints via /api/menu and /api/orders');
});

// Start Server and Connect Database
async function startServer() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.warn('⚠️ [Backend] Proceeding with server start despite DB connection warning:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Backend] Server listening on port ${PORT}`);
    console.log(`📍 [Backend] Local:    http://localhost:${PORT}`);
    console.log(`📍 [Backend] Health:   http://localhost:${PORT}/api/health`);
    console.log(`📍 [Backend] Menu DB:  http://localhost:${PORT}/api/menu`);
    console.log(`📍 [Backend] Orders:   http://localhost:${PORT}/api/orders`);
  });
}

startServer();
