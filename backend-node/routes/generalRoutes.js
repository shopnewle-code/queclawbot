import express from "express";
import SubscriptionService from "../services/subscriptionService.js";
import AIService from "../services/aiService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * General/Health Routes
 */

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", async (req, res) => {
  try {
    const dbStatus = true; // If we got here, DB is connected
    const aiStatus = await AIService.healthCheck();

    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date(),
      services: {
        database: dbStatus ? "✅ Online" : "❌ Offline",
        aiEngine: aiStatus ? "✅ Online" : "⚠️ Offline",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

/**
 * GET /api/stats
 * Get bot statistics (public)
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await SubscriptionService.getStats();

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    logger.error("Failed to get stats", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics",
    });
  }
});

/**
 * GET /api/user/:telegramId
 * Get user information
 */
router.get("/user/:telegramId", async (req, res) => {
  try {
    const user = await SubscriptionService.findOrCreateUser(req.params.telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        plan: user.plan,
        subscriptionActive: user.subscriptionActive,
        aiUsage: user.aiUsage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error("Failed to get user", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user",
    });
  }
});

/**
 * GET /
 * Root endpoint
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 QueClaw AI Server Running",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      stats: "GET /api/stats",
      subscription: "POST /api/paypal/create-subscription",
      webhook: "POST /api/paypal/webhook",
    },
  });
});

export default router;
