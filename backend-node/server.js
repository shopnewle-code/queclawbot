import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import TelegramBot from "node-telegram-bot-api";

// Configuration
import { env } from "./config/env.js";
import { connectMongoDB } from "./config/mongodb.js";

// Services
import SubscriptionService from "./services/subscriptionService.js";

// Handlers
import registerBotHandlers from "./handlers/botHandlers.js";

// Routes
import generalRoutes from "./routes/generalRoutes.js";
import paypalRoutes from "./routes/paypalRoutes.js";

// Middleware
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateJSON,
} from "./middleware/errorHandler.js";

// Utils
import { logger } from "./utils/logger.js";

/* ==============================
INITIALIZATION
============================== */

const app = express();

// Store bot instance for webhook access
let botInstance = null;

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    logger.info("🚀 Initializing QueClaw AI Server...");

    // Middleware
    app.use(helmet());
    app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        credentials: true,
      })
    );
    app.use(express.json({ limit: "10mb" }));
    app.use(validateJSON);
    app.use(requestLogger);

    // Database
    await connectMongoDB();


    // Initialize Telegram Bot
    if (!env.TELEGRAM_TOKEN) {
      throw new Error("TELEGRAM_TOKEN is required");
    }

    botInstance = new TelegramBot(env.TELEGRAM_TOKEN, { polling: true });
    logger.success("🤖 Telegram bot initialized");

    // Register bot handlers
    registerBotHandlers(botInstance);

    // Store bot instance in app for webhook access
    app.locals.bot = botInstance;

    // API Routes
    app.use("/api", generalRoutes);
    app.use("/api/paypal", paypalRoutes);

    // Global 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Subscription expiry check (every hour)
    setInterval(
      async () => {
        try {
          await SubscriptionService.checkAndDeactivateExpired();
        } catch (error) {
          logger.error("Error checking expired subscriptions", error);
        }
      },
      env.SUBSCRIPTION_CHECK_INTERVAL
    );

    logger.success("✅ Subscription expiry check scheduled");

    return app;
  } catch (error) {
    logger.error("Failed to initialize application", error);
    process.exit(1);
  }
}

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize app
    await initializeApp();

    // Start listening
    app.listen(env.PORT, () => {
      logger.success(`🚀 Server running on port ${env.PORT}`);
      logger.info(`🌍 Base URL: ${env.BASE_URL}`);
      logger.info(`🔧 Mode: ${env.NODE_ENV}`);
      logger.info(`💾 Database: MongoDB`);
      logger.info(`🔌 AI Engine: ${env.AI_SERVER_URL}`);
      logger.info(`💳 PayPal: ${env.PAYPAL_MODE} mode`);

      // Print available commands
      console.log("\n" + "=".repeat(50));
      console.log("Available Bot Commands:");
      console.log("  /help     - Show help menu");
      console.log("  /ai       - Ask AI a question");
      console.log("  /upgrade  - Subscribe to Pro");
      console.log("  /profile  - View your profile");
      console.log("  /stats    - View statistics (admin only)");
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

/* ==============================
GRACEFUL SHUTDOWN
============================== */

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  logger.info("📴 Shutting down gracefully...");

  if (botInstance) {
    botInstance.stopPolling();
  }

  process.exit(0);
}

/* ==============================
ERROR HANDLING
============================== */

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

/* ==============================
START APPLICATION
============================== */

startServer();

export default app;