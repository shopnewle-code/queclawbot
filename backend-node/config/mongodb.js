import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB Connection Configuration
 */

export async function connectMongoDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    return mongoose.connection;
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
}

export function disconnectMongoDB() {
  return mongoose.disconnect();
}

export default mongoose;
