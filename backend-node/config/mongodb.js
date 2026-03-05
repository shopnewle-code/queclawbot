import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB Connection Configuration
 * Includes retry logic, health checks, and graceful shutdown
 */

let isConnecting = false;
let connectionAttempts = 0;

export async function connectMongoDB(retries = 5, delay = 2000) {
  if (isConnecting) {
    console.warn("⏳ Connection attempt already in progress");
    return mongoose.connection;
  }

  isConnecting = true;
  connectionAttempts = 0;

  for (let attempt = 1; attempt <= retries; attempt++) {
    connectionAttempts = attempt;
    try {
      await mongoose.connect(env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      console.log("✅ MongoDB Connected Successfully");
      
      // Setup event listeners for connection monitoring
      setupConnectionListeners();

      isConnecting = false;
      return mongoose.connection;
    } catch (err) {
      console.error(
        `❌ MongoDB Connection Attempt ${attempt}/${retries} failed:`,
        err.message
      );

      if (attempt === retries) {
        console.error("❌ Unable to connect to MongoDB after all retries");
        isConnecting = false;
        process.exit(1);
      }

      const waitTime = delay * attempt;
      console.log(
        `⏳ Retrying in ${waitTime}ms... (Attempt ${attempt}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Setup event listeners for MongoDB connection monitoring
 */
function setupConnectionListeners() {
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected - attempting to reconnect");
    attemptReconnection();
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err.message);
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully");
  });

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connection established");
  });
}

/**
 * Attempt automatic reconnection with backoff
 */
async function attemptReconnection(maxRetries = 3, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log("✅ Automatic reconnection successful");
        return true;
      }
    } catch (err) {
      console.warn(`⚠️ Reconnection attempt ${i + 1}/${maxRetries} failed`);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  console.error("❌ Unable to reconnect to MongoDB");
  return false;
}

/**
 * Health check function to verify MongoDB connection status
 * Returns connection state and metadata
 */
export async function checkMongoDBHealth() {
  try {
    if (!mongoose.connection) {
      return {
        isConnected: false,
        status: "No connection object",
        readyState: -1,
      };
    }

    const readyState = mongoose.connection.readyState;
    const states = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    // Perform a ping to ensure connection is responsive
    if (readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return {
        isConnected: true,
        status: states[readyState],
        readyState,
        timestamp: new Date().toISOString(),
      };
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
    console.log("ℹ️ MongoDB was not connected");
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
    connectionAttempts,
  };
}

export function disconnectMongoDB() {
  return mongoose.disconnect();
}

export default mongoose;
