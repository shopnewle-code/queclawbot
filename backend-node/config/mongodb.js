import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB Connection Configuration
 * Includes retry logic for resilience
 */

export async function connectMongoDB(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
      });

      console.log("✅ MongoDB Connected Successfully");
      
      // Setup event listeners
      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB error:", err.message);
      });

      return mongoose.connection;
    } catch (err) {
      console.error(
        `❌ MongoDB Connection Attempt ${attempt}/${retries} failed:`,
        err.message
      );

      if (attempt === retries) {
        console.error("❌ Unable to connect to MongoDB after all retries");
        process.exit(1);
      }

      console.log(
        `⏳ Retrying in ${delay * attempt}ms... (Attempt ${attempt}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

export function disconnectMongoDB() {
  return mongoose.disconnect();
}

export default mongoose;
