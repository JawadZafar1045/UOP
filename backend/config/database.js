const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,          // max concurrent connections in pool
      minPoolSize: 5,           // keep 5 connections warm at all times
      socketTimeoutMS: 45000,   // close idle sockets after 45s
      serverSelectionTimeoutMS: 15000, // allow up to 15s for Atlas cluster selection
      heartbeatFrequencyMS: 10000,    // check server health every 10s
      retryWrites: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} — pool size: 20`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected — pool size: 20');
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('♻️  MongoDB reconnected.');
    });
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
