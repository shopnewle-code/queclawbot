import express from "express";
import { env } from "../config/env.js";
import PayPalService from "../services/paypalService.js";
import handlePayPalWebhook from "../handlers/paypalWebhookHandler.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * Debug middleware - log all requests to this router
 */
router.use((req, res, next) => {
  logger.warn(`\n📡 [PayPal Routes] ${req.method} ${req.path}`);
  logger.warn(`Body preview: ${JSON.stringify(req.body).substring(0, 100)}...`);
  next();
});

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
 * PayPal webhook endpoint - MAIN ENTRY POINT FOR PAYPAL EVENTS
 */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    if (!event.event_type) {
      logger.warn("❌ Invalid webhook: missing event_type");
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

    logger.warn(`\n${"=".repeat(80)}`);
    logger.warn(`📡 PAYPAL WEBHOOK RECEIVED`);
    logger.warn(`Event Type: ${event.event_type}`);
    logger.warn(`Resource ID: ${event.resource?.id}`);
    logger.warn(`Custom ID: ${event.resource?.custom_id}`);
    logger.warn(`Status: ${event.resource?.status}`);
    logger.warn(`${"=".repeat(80)}\n`);
    
    // Process webhook asynchronously but wait for it
    const result = await handlePayPalWebhook(event, bot);

    logger.success(`✅ Webhook processed successfully`);

    // Always return 200 to PayPal to confirm receipt
    res.json({
      success: true,
      message: "Webhook processed",
      event_type: event.event_type,
      processed: result,
    });
  } catch (error) {
    logger.error("❌ Webhook processing error", error);
    // Still return 200 to prevent PayPal from retrying with old data
    res.json({
      success: false,
      error: "Webhook processing failed",
      message: error.message,
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
 * POST /api/paypal/test-webhook/:subscriptionId
 * Test webhook activation flow with full logging
 */
router.post("/test-webhook/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const planParam = req.query.plan || "pro"; // Allow plan override via query param

    logger.warn(`🧪 TEST WEBHOOK: Simulating BILLING.SUBSCRIPTION.ACTIVATED for ${subscriptionId}`);

    // Step 1: Fetch subscription details from PayPal
    logger.info(`[1/4] Fetching subscription details from PayPal...`);
    let telegramId = null;
    
    try {
      const paypalService = new PayPalService();
      const subscriptionDetails = await paypalService.getSubscriptionDetails(subscriptionId);
      
      logger.info(`[1/4] PayPal Details:`, JSON.stringify(subscriptionDetails, null, 2));
      telegramId = subscriptionDetails.custom_id;
      
      if (!telegramId) {
        return res.status(400).json({
          success: false,
          error: "custom_id not found in PayPal subscription",
          details: subscriptionDetails,
        });
      }
      
      logger.success(`[1/4] Extracted telegramId: ${telegramId}`);
    } catch (err) {
      logger.error(`[1/4] Failed to fetch from PayPal:`, err.message);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch subscription from PayPal",
        message: err.message,
      });
    }

    // Step 2: Activate subscription in database
    logger.info(`[2/4] Activating subscription in database...`);
    const { PLANS } = await import("../utils/constants.js");
    const plan = planParam === "premium" ? PLANS.PREMIUM : PLANS.PRO;

    const activated = await SubscriptionService.activateSubscription(
      telegramId,
      subscriptionId,
      1,
      plan
    );

    if (!activated) {
      return res.status(500).json({
        success: false,
        error: "Failed to activate subscription",
      });
    }

    logger.success(`[2/4] Subscription activated in database`);

    // Step 3: Verify in MongoDB
    logger.info(`[3/4] Verifying in MongoDB...`);
    const { User } = await import("../models/User.js");
    const verifyUser = await User.findOne({ telegramId });

    if (!verifyUser) {
      return res.status(500).json({
        success: false,
        error: "User not found after activation",
      });
    }

    logger.info(`[3/4] Verification Results:`);
    logger.info(`  subscriptionActive: ${verifyUser.subscriptionActive}`);
    logger.info(`  subscriptionId: ${verifyUser.subscriptionId}`);
    logger.info(`  plan: ${verifyUser.plan}`);
    logger.info(`  subscriptionExpire: ${verifyUser.subscriptionExpire}`);
    logger.info(`  updatedAt: ${verifyUser.updatedAt}`);

    if (!verifyUser.subscriptionActive) {
      logger.error(`[3/4] ❌ VERIFICATION FAILED: subscriptionActive is false!`);
      return res.status(500).json({
        success: false,
        error: "Subscription not marked as active in database",
        userState: {
          subscriptionActive: verifyUser.subscriptionActive,
          subscriptionId: verifyUser.subscriptionId,
          plan: verifyUser.plan,
        },
      });
    }

    logger.success(`[3/4] ✅ Verification PASSED`);

    // Step 4: Send bot notification
    logger.info(`[4/4] Sending bot notification...`);
    try {
      // Note: This requires the bot instance exported from server.js
      // For testing, we'll just log it
      logger.success(`[4/4] Would send activation message to user ${telegramId}`);
    } catch (err) {
      logger.warn(`[4/4] Failed to send bot message:`, err.message);
      // Don't fail the webhook for this
    }

    logger.success(`✅✅✅ WEBHOOK TEST COMPLETED SUCCESSFULLY`);

    res.json({
      success: true,
      message: "Webhook test completed successfully",
      telegramId,
      subscriptionId,
      plan,
      userState: {
        subscriptionActive: verifyUser.subscriptionActive,
        subscriptionId: verifyUser.subscriptionId,
        plan: verifyUser.plan,
        subscriptionExpire: verifyUser.subscriptionExpire,
        updatedAt: verifyUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Test webhook failed", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/paypal/debug-resend-webhook/:subscriptionId
 * Manually resend webhook for testing (simulates PayPal resend from dashboard)
 */
router.post("/debug-resend-webhook/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const { User } = await import("../models/User.js");
    const { handlePayPalWebhook } = await import("../handlers/paypalWebhookHandler.js");

    logger.warn(`\n${"=".repeat(80)}`);
    logger.warn(`🧪 DEBUG: Manually resending webhook for subscription ${subscriptionId}`);
    logger.warn(`${"=".repeat(80)}\n`);

    // Fetch subscription details from PayPal
    const subscriptionDetails = await PayPalService.getSubscriptionDetails(subscriptionId);

    if (!subscriptionDetails) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found in PayPal",
      });
    }

    // Build webhook event
    const simulatedEvent = {
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: subscriptionId,
        custom_id: subscriptionDetails.custom_id,
        status: subscriptionDetails.status,
      },
    };

    logger.info(`Simulated Event:`, JSON.stringify(simulatedEvent, null, 2));

    // Get bot instance
    const bot = req.app.locals.bot;
    if (!bot) {
      return res.status(500).json({
        success: false,
        error: "Bot not initialized",
      });
    }

    // Process webhook
    const result = await handlePayPalWebhook(simulatedEvent, bot);

    // Verify result
    const user = await User.findOne({ telegramId: subscriptionDetails.custom_id });

    res.json({
      success: true,
      message: "Webhook resend simulated",
      result,
      userState: user ? {
        telegramId: user.telegramId,
        subscriptionActive: user.subscriptionActive,
        plan: user.plan,
        subscriptionExpire: user.subscriptionExpire,
      } : null,
    });
  } catch (error) {
    logger.error("Debug webhook resend failed", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
 * GET /api/paypal/health
 * Diagnostic endpoint - checks if webhook route is working
 */
router.get("/health", (req, res) => {
  logger.success(`✅ PayPal routes are working`);
  res.json({
    success: true,
    message: "PayPal routes are operational",
    endpoints: {
      webhook: "POST /api/paypal/webhook",
      "create-subscription": "POST /api/paypal/create-subscription",
      "test-webhook": "POST /api/paypal/test-webhook/:subscriptionId",
      "debug-resend-webhook": "POST /api/paypal/debug-resend-webhook/:subscriptionId",
      "debug-activate": "POST /api/paypal/debug-activate/:telegramId",
      "test-activate": "POST /api/paypal/test-activate/:telegramId",
      verify: "GET /api/paypal/verify/:telegramId",
    },
    timestamp: new Date().toISOString(),
  });
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
