const mongoose = require("mongoose");

// Cache connection across serverless invocations
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MongoDB connection failed: missing MONGODB_URI or MONGO_URI environment variable');
    return;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    }).then((m) => {
      console.log("✅ MongoDB connected");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB connection failed", error);
  }

  return cached.conn;
};

module.exports = connectDB;
