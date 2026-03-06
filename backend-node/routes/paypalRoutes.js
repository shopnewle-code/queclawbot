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
      logger.warn("Invalid webhook: missing event_type");
      return res.status(400).json({
        success: false,
        error: "Invalid webhook event",
      });
    }

    // Get bot instance from request context
    const bot = req.app.locals.bot;

    if (!bot) {
      logger.error("❌ Bot instance not available for webhook");
      return res.status(500).json({
        success: false,
        error: "Bot not initialized",
      });
    }

    logger.info(`🔔 Webhook received - Event: ${event.event_type}`);
    logger.info(`Resource ID: ${event.resource?.id}`);
    logger.info(`Custom ID (TelegramID): ${event.resource?.custom_id}`);
    
    // Process webhook asynchronously but wait for it
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
        queriesUsedToday: user.queriesUsedToday,
        totalQueries: user.totalQueries,
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
 * POST /api/paypal/test-activate/:telegramId
 * Test subscription activation directly
 */
router.post("/test-activate/:telegramId", async (req, res) => {
  try {
    const { User } = await import("../models/User.js");
    const telegramId = req.params.telegramId;

    logger.warn(`🔬 TEST ACTIVATION for ${telegramId}`);

    // Step 1: Find user
    logger.info(`[1/6] Finding user...`);
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    logger.info(`[1/6] User found: ${user._id}`);

    // Step 2: Prepare data
    logger.info(`[2/6] Preparing subscription data...`);
    const expire = new Date();
    expire.setMonth(expire.getMonth() + 1);

    // Step 3: Update object
    logger.info(`[3/6] Updating user object...`);
    user.subscriptionActive = true;
    user.subscriptionId = `TEST-${Date.now()}`;
    user.subscriptionExpire = expire;
    user.plan = "pro";

    // Step 4: Save
    logger.info(`[4/6] Saving to MongoDB...`);
    const saved = await user.save();
    logger.success(`[4/6] Saved successfully`);

    // Step 5: Verify in memory
    logger.info(`[5/6] Verifying saved object:`);
    logger.info(`  subscriptionActive: ${saved.subscriptionActive}`);
    logger.info(`  subscriptionId: ${saved.subscriptionId}`);
    logger.info(`  plan: ${saved.plan}`);

    // Step 6: Fetch from DB
    logger.info(`[6/6] Fetching fresh from MongoDB...`);
    const fresh = await User.findOne({ telegramId });
    logger.info(`[6/6] Fresh from DB:`);
    logger.info(`  subscriptionActive: ${fresh.subscriptionActive}`);
    logger.info(`  subscriptionId: ${fresh.subscriptionId}`);
    logger.info(`  plan: ${fresh.plan}`);

    res.json({
      success: true,
      message: "Test activation completed",
      user: {
        telegramId: fresh.telegramId,
        subscriptionActive: fresh.subscriptionActive,
        subscriptionId: fresh.subscriptionId,
        plan: fresh.plan,
        subscriptionExpire: fresh.subscriptionExpire,
      },
    });
  } catch (error) {
    logger.error("Test activation failed", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/paypal/debug-activate/:telegramId
 * Manual activation for testing (development only)
 */
router.post("/debug-activate/:telegramId", async (req, res) => {
  try {
    const { User } = await import("../models/User.js");
    const telegramId = req.params.telegramId;
    
    logger.warn(`🔧 MANUAL ACTIVATION TRIGGERED for ${telegramId}`);
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Manual activation
    const expire = new Date();
    expire.setMonth(expire.getMonth() + 1);

    user.subscriptionActive = true;
    user.subscriptionId = `DEBUG-${Date.now()}`;
    user.subscriptionExpire = expire;
    user.plan = "pro";
    user.aiUsage = 0;

    const saved = await user.save();

    logger.success(`🔧 MANUAL ACTIVATION COMPLETED for ${telegramId}`);

    res.json({
      success: true,
      message: "Manually activated subscription",
      user: {
        subscriptionActive: saved.subscriptionActive,
        plan: saved.plan,
        subscriptionExpire: saved.subscriptionExpire,
      },
    });
  } catch (error) {
    logger.error("Failed to manually activate", error);
    res.status(500).json({
      success: false,
      error: "Failed to activate",
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
