import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './services/seedDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Normalize URL path when running behind Vercel serverless rewrites
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && !matchedPath.includes('index.js') && !matchedPath.includes('server.js')) {
    req.url = matchedPath;
  }
  next();
});

// Serverless DB connection middleware (ensures DB is active for every serverless request)
let isDbInitialized = false;
app.use(async (req, res, next) => {
  try {
    if (!isDbInitialized || mongoose.connection.readyState !== 1) {
      await connectDB();
      await seedDatabaseIfEmpty();
      isDbInitialized = true;
    }
  } catch (err) {
    console.warn('[DB Middleware] Database connection warning:', err.message);
  }
  next();
});

// Serve static 3D models from backend/models if running locally
const modelsPath = path.resolve(__dirname, '../models');
app.use('/models', express.static(modelsPath));

// API Routes (mounted under both /api/* and root paths for Vercel Services compatibility)
app.use('/api/menu', menuRoutes);
app.use('/menu', menuRoutes);

app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

app.use('/api/scan', scanRoutes);
app.use('/scan', scanRoutes);

// Health check endpoint
const handleHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  res.status(200).json({
    status: 'ONLINE',
    service: 'AR Restaurant Backend API',
    database: {
      provider: 'MongoDB Atlas',
      status: dbStatus,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none'
    },
    version: '1.2.0',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node Server',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Root welcome route
app.get('/', (req, res) => {
  res.send('🍛 AR Restaurant Backend API with MongoDB Atlas is running.');
});

export default app;
