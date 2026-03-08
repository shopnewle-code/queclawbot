import dotenv from "dotenv";

dotenv.config();

/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

export const env = {
  // Server
  PORT: process.env.PORT || 3000,
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Telegram
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  ADMIN_ID: process.env.ADMIN_ID,

  // PayPal
  PAYPAL_MODE: process.env.PAYPAL_MODE || "sandbox",
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_SECRET: process.env.PAYPAL_SECRET,
  PAYPAL_PLAN_ID: process.env.PAYPAL_PLAN_ID,
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,

  PAYPAL_BASE_URL:
    process.env.PAYPAL_MODE === "live"
      ? "https://api.paypal.com"
      : "https://api-m.sandbox.paypal.com",

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/queclaw",

  // AI Engine
  AI_SERVER_URL:
    process.env.AI_SERVER_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8000" : ""),
  AI_PROVIDER: process.env.AI_PROVIDER || "auto",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,

  // Settings
  AI_USAGE_FREE_LIMIT: 5,
  AI_USAGE_PRO_LIMIT: 10000,
  SUBSCRIPTION_CHECK_INTERVAL: 3600000, // 1 hour
};

// Validate required environment variables
const requiredEnvVars = [
  "TELEGRAM_TOKEN",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_SECRET",
  "PAYPAL_PLAN_ID",
  "MONGO_URI",
];

requiredEnvVars.forEach((varName) => {
  if (!env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in .env`);
  }
});

export default env;
