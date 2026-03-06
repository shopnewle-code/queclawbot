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
      await SubscriptionService.checkAndDeactivateExpired();
      await SubscriptionService.checkAndActivatePending();
    } catch (err) {
      logger.error("Subscription check failed", err);
    }
  }, env.SUBSCRIPTION_CHECK_INTERVAL);

  logger.info("⏰ Subscription checker active (deactivate expired + activate pending)");
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