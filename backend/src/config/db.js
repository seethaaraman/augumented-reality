import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows DNS SRV record resolution for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

const LOCAL_URI = 'mongodb://127.0.0.1:27017/ar_restaurant';

export async function connectDB() {
  const configuredUri = process.env.MONGODB_URI?.trim();
  const uri = configuredUri && !configuredUri.includes('YourActualPassword') && !configuredUri.includes('<db_password>')
    ? configuredUri
    : LOCAL_URI;

  try {
    console.log(`🍃 [MongoDB] Connecting to database (${uri.includes('mongodb+srv') ? 'MongoDB Atlas Cloud' : 'Local MongoDB'})...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });

    console.log(`🍃 [MongoDB] Connected successfully! Host: ${conn.connection.host}, Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ [MongoDB] Primary connection failed (${error.message}). Attempting fallback to local MongoDB...`);
    try {
      const fallbackConn = await mongoose.connect(LOCAL_URI, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`🍃 [MongoDB] Connected to local fallback database: ${fallbackConn.connection.name}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`❌ [MongoDB] All connections failed: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB] Disconnected from database.');
});
