import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB Connection Configuration
 */

export async function connectMongoDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log("✅ MongoDB Connected Successfully");
    return mongoose.connection;
  } catch (err) {
    console.error("❌ MongoDB Connection failed:", err.message);
    process.exit(1);
  }
}

/**
 * Health check function to verify MongoDB connection status
 */
export async function checkMongoDBHealth() {
  try {
    const readyState = mongoose.connection.readyState;
    const states = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    if (readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }

    return {
      isConnected: readyState === 1,
      status: states[readyState] || "Unknown",
      readyState,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("❌ MongoDB health check failed:", err.message);
    return {
      isConnected: false,
      status: "Health check failed",
      error: err.message,
    };
  }
}

/**
 * Graceful shutdown of MongoDB connection
 */
export async function disconnectMongoDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected gracefully");
      return true;
    }
    return true;
  } catch (err) {
    console.error("❌ Error disconnecting MongoDB:", err.message);
    return false;
  }
}

/**
 * Get connection status
 */
export function getMongoDBStatus() {
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || "Unknown",
    isConnected: mongoose.connection.readyState === 1,
  };
}

export default mongoose;
