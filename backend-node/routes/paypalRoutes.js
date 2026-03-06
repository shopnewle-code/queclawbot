import express from "express";
import { env } from "../config/env.js";
import PayPalService from "../services/paypalService.js";
import handlePayPalWebhook from "../handlers/paypalWebhookHandler.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * PayPal Routes
 */

/**
 * POST /api/paypal/create-subscription
 * Create a PayPal subscription for a user
 */
router.post("/create-subscription", async (req, res) => {
  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: "telegram_id is required",
      });
    }

    const { subscriptionId, approvalUrl } = await PayPalService.createSubscription(telegram_id);

    res.json({
      success: true,
      subscriptionId,
      url: approvalUrl,
    });
  } catch (error) {
    logger.error("Subscription creation error", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subscription",
      details: error.message,
    });
  }
});

/**
 * POST /api/paypal/create-order
 * Create a one-time PayPal order
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount = "5.00", currency = "USD" } = req.body;

    const order = await PayPalService.createOrder(amount, currency);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error("Order creation error", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
});

/**
 * POST /api/paypal/webhook
 * PayPal webhook endpoint
 */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    if (!event.event_type) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook event",
      });
    }

    // Get bot instance from request context
    // Note: You'll need to pass the bot instance to the express app
    const bot = req.app.locals.bot;

    if (!bot) {
      logger.warn("Bot instance not available for webhook");
      return res.status(500).json({
        success: false,
        error: "Bot not initialized",
      });
    }

    logger.info(`🔔 Webhook received - Event: ${event.event_type}`);
    logger.debug(`Event Resource: ${JSON.stringify(event.resource)}`);
    
    await handlePayPalWebhook(event, bot);

    res.json({
      success: true,
      message: "Webhook processed",
      event_type: event.event_type,
    });
  } catch (error) {
    logger.error("Webhook processing error", error);
    res.status(500).json({
      success: false,
      error: "Webhook processing failed",
    });
  }
});

/**
 * GET /api/paypal/subscription/:id
 * Get subscription details
 */
router.get("/subscription/:id", async (req, res) => {
  try {
    const details = await PayPalService.getSubscriptionDetails(req.params.id);

    res.json({
      success: true,
      subscription: details,
    });
  } catch (error) {
    logger.error("Failed to fetch subscription details", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription",
    });
  }
});

/**
 * GET /api/paypal/verify/:telegramId
 * Verify user subscription status
 */
router.get("/verify/:telegramId", async (req, res) => {
  try {
    const { User } = await import("../models/User.js");
    const user = await User.findOne({ telegramId: req.params.telegramId });

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
        subscriptionActive: user.subscriptionActive,
        subscriptionId: user.subscriptionId,
        subscriptionExpire: user.subscriptionExpire,
        plan: user.plan,
        aiUsage: user.aiUsage,
      },
    });
  } catch (error) {
    logger.error("Failed to verify subscription", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify subscription",
    });
  }
});

/**
 * POST /api/paypal/cancel/:id
 * Cancel a subscription
 */
router.post("/cancel/:id", async (req, res) => {
  try {
    await PayPalService.cancelSubscription(req.params.id);

    res.json({
      success: true,
      message: "Subscription cancelled",
    });
  } catch (error) {
    logger.error("Failed to cancel subscription", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription",
    });
  }
});

/**
 * GET /api/paypal/success
 * PayPal redirect after successful subscription
 */
router.get("/success", async (req, res) => {
  try {
    // Extract subscription ID from URL params if available
    const subscriptionId = req.query.subscription_id;
    
    logger.info(`PayPal Success redirect - Subscription: ${subscriptionId}`);
    
    // Attempt to fetch subscription details and activate if needed
    if (subscriptionId) {
      try {
        const details = await PayPalService.getSubscriptionDetails(subscriptionId);
        logger.info(`Subscription details fetched: ${JSON.stringify(details)}`);
      } catch (err) {
        logger.warn(`Could not fetch subscription details: ${err.message}`);
      }
    }
    
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Subscription Successful!</h1>
          <p>Your subscription has been processed.</p>
          <p>Activating your account... (may take 1-2 minutes)</p>
          <p>Use <code>/verify</code> in the bot to check your status.</p>
          <p><a href="https://t.me/queclawbot">← Return to Bot</a></p>
          <hr style="margin-top: 50px;">
          <p style="font-size: 12px; color: #666;">
            If your status doesn't update, use /verify command in Telegram
          </p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error("Success page error", error);
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Subscription Processed</h1>
          <p>Your subscription is being activated.</p>
          <p><a href="https://t.me/queclawbot">← Return to Bot</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/paypal/cancel
 * PayPal redirect if user cancels subscription
 */
router.get("/cancel", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Subscription Cancelled</h1>
        <p>You cancelled the subscription process.</p>
        <p>You can try again anytime.</p>
        <p><a href="https://t.me/queclawbot">Return to Bot</a></p>
      </body>
    </html>
  `);
});

export default router;
