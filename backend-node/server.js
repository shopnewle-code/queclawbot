import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";
import TelegramBot from "node-telegram-bot-api";

import { env } from "./config/env.js";
import { connectMongoDB } from "./config/mongodb.js";

import SubscriptionService from "./services/subscriptionService.js";
import registerBotHandlers from "./handlers/botHandlers.js";
import handlePayPalWebhook from "./handlers/paypalWebhookHandler.js";

import generalRoutes from "./routes/generalRoutes.js";
import paypalRoutes from "./routes/paypalRoutes.js";

import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateJSON,
} from "./middleware/errorHandler.js";

import { logger } from "./utils/logger.js";

/* ==============================
APP INIT
============================== */

const app = express();
let bot;

/* ==============================
MIDDLEWARE
============================== */

app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(validateJSON);

/**
 * PayPal Webhook Debug Middleware
 * Log all PayPal webhook requests before routing
 */
app.use((req, res, next) => {
  if (req.path.includes("paypal") || req.path.includes("webhook")) {
    logger.warn(`\n${"=".repeat(80)}`);
    logger.warn(`🔔 INCOMING REQUEST TO WEBHOOK`);
    logger.warn(`Method: ${req.method}`);
    logger.warn(`Path: ${req.path}`);
    logger.warn(`Full URL: ${req.originalUrl}`);
    logger.warn(`Content-Type: ${req.headers["content-type"]}`);
    logger.warn(`Body Size: ${JSON.stringify(req.body).length} bytes`);
    logger.warn(`${"=".repeat(80)}\n`);
  }
  next();
});

app.use(requestLogger);

/* ==============================
HEALTH CHECK
============================== */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "running",
    service: "QueClaw AI Bot",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Extended health check with database status
app.get("/health", async (req, res) => {
  try {
    const dbStatus = await import("./config/mongodb.js").then(() => "connected");

    res.status(200).json({
      status: "healthy",
      service: "QueClaw AI Bot",
      environment: env.NODE_ENV,
      database: dbStatus,
      bot: bot ? "active" : "inactive",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/* ==============================
TELEGRAM WEBHOOK
============================== */

app.post("/webhook", async (req, res) => {
  try {
    // Log incoming webhook
    logger.info("Webhook received", { updateId: req.body?.update_id });

    if (!req.body) {
      return res.sendStatus(400);
    }

    if (bot) {
      await bot.processUpdate(req.body);
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook error:", error);
    res.sendStatus(200);
  }
});

/* ==============================
API ROUTES
============================== */

app.use("/api", generalRoutes);
app.use("/api/paypal", paypalRoutes);

/* ==============================
PAYPAL WEBHOOK (Direct Route - No /api prefix)
============================== */
// PayPal sends webhooks to /paypal/webhook (not /api/paypal/webhook)
// We need a direct route here to catch it

app.post("/paypal/webhook", async (req, res) => {
  try {
    const event = req.body;

    if (!event.event_type) {
      logger.warn("❌ Invalid webhook: missing event_type");
      return res.status(400).json({
        success: false,
        error: "Invalid webhook event",
      });
    }

    const bot = req.app.locals.bot;

    if (!bot) {
      logger.error("❌ Bot instance not available for webhook");
      return res.status(500).json({
        success: false,
        error: "Bot not initialized",
      });
    }

    logger.warn(`\n${"=".repeat(80)}`);
    logger.warn(`📡 PAYPAL WEBHOOK RECEIVED (Direct Route)`);
    logger.warn(`Event Type: ${event.event_type}`);
    logger.warn(`Resource ID: ${event.resource?.id}`);
    logger.warn(`Custom ID: ${event.resource?.custom_id}`);
    logger.warn(`Status: ${event.resource?.status}`);
    logger.warn(`${"=".repeat(80)}\n`);
    
    const result = await handlePayPalWebhook(event, bot);

    // Always return 200 OK to PayPal to confirm receipt
    res.status(200).json({
      success: true,
      message: "Webhook processed",
      event_type: event.event_type,
      processed: result,
    });
  } catch (error) {
    logger.error("❌ Webhook processing error", error);
    // Still return 200 to prevent PayPal from retrying
    res.status(200).json({
      success: false,
      error: "Webhook processing failed",
      message: error.message,
    });
  }
});

/* ==============================
ERROR HANDLING
============================== */

app.use(notFoundHandler);
app.use(errorHandler);

/* ==============================
INITIALIZATION
============================== */

async function initialize() {
  try {
    logger.info("🚀 Starting QueClaw Server...");

    await connectMongoDB();

    if (!env.TELEGRAM_TOKEN) {
      throw new Error("TELEGRAM_TOKEN missing");
    }

    bot = new TelegramBot(env.TELEGRAM_TOKEN);
    registerBotHandlers(bot);

    app.locals.bot = bot;

    logger.success("🤖 Telegram bot ready");

    if (env.BASE_URL) {
      const webhookURL = `${env.BASE_URL}/webhook`;

      await bot.setWebHook(webhookURL);

      logger.success(`🌐 Webhook set: ${webhookURL}`);
    }

    scheduleJobs();

  } catch (error) {
    logger.error("Initialization failed", error);
    process.exit(1);
  }
}

/* ==============================
CRON JOBS
============================== */

function scheduleJobs() {
  setInterval(async () => {
    try {
      // Deactivate expired subscriptions
      await SubscriptionService.checkAndDeactivateExpired();
      // Activate pending subscriptions (webhook fallback)
      await SubscriptionService.checkAndActivatePending();
      // Send expiry warnings (24 hours before)
      if (bot) {
        await SubscriptionService.checkAndNotifyExpiringSubscriptions(bot);
      }
      // Reset notification flags for renewed subscriptions
      await SubscriptionService.resetExpiryNotifications();
    } catch (err) {
      logger.error("Subscription check failed", err);
    }
  }, env.SUBSCRIPTION_CHECK_INTERVAL);

  logger.info(
    "⏰ Subscription manager active: expiry detection, warnings, and auto-activation"
  );
}

/* ==============================
SERVER START
============================== */

async function startServer() {
  await initialize();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    logger.success(`🚀 Server running on port ${PORT}`);
    logger.info(`🌍 Base URL: ${env.BASE_URL}`);
    logger.info(`💾 MongoDB connected`);
    logger.info(`💳 PayPal mode: ${env.PAYPAL_MODE}`);
  });
}

/* ==============================
GRACEFUL SHUTDOWN
============================== */

function shutdown() {
  logger.warn("Shutting down server...");

  if (bot) {
    bot.stopPolling();
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ==============================
GLOBAL ERROR
============================== */

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  process.exit(1);
});

/* ==============================
START APP
============================== */

startServer();

export default app;