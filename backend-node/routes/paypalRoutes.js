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

    await handlePayPalWebhook(event, bot);

    res.json({
      success: true,
      message: "Webhook processed",
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
router.get("/success", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>✅ Subscription Successful!</h1>
        <p>Your subscription has been activated.</p>
        <p>You can now use unlimited AI queries.</p>
        <p><a href="https://t.me/queclawbot">Return to Bot</a></p>
      </body>
    </html>
  `);
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
