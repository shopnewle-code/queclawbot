import { PAYPAL_EVENTS } from "../utils/constants.js";
import { User } from "../models/User.js";
import SubscriptionService from "../services/subscriptionService.js";
import { PayPalService } from "../services/paypalService.js";
import { logger } from "../utils/logger.js";

/**
 * PayPal Webhook Handler
 * Processes PayPal subscription and payment events
 */

export async function handlePayPalWebhook(event, bot) {
  try {
    logger.info(`📩 PayPal Event: ${event.event_type}`);
    logger.info(`Event Type: ${event.event_type}, Resource ID: ${event.resource?.id}`);

    switch (event.event_type) {
      case PAYPAL_EVENTS.ACTIVATION:
        logger.info(`🎯 Processing subscription activation event`);
        await handleSubscriptionActivation(event, bot);
        break;

      case PAYPAL_EVENTS.PAYMENT_COMPLETED:
        logger.info(`💳 Processing payment completed event`);
        await handlePaymentCompleted(event, bot);
        break;

      case PAYPAL_EVENTS.CANCELLED:
      case PAYPAL_EVENTS.EXPIRED:
        logger.info(`❌ Processing subscription cancellation/expiry event`);
        await handleSubscriptionCancelled(event, bot);
        break;

      default:
        logger.warn(`⚠️ Unhandled PayPal event: ${event.event_type}`);
    }

    return true;
  } catch (error) {
    logger.error("❌ PayPal webhook error", error);
    return false;
  }
}

/**
 * Handle subscription activation event
 */
async function handleSubscriptionActivation(event, bot) {
  try {
    let telegramId = event.resource.custom_id;
    const subscriptionId = event.resource.id;

    logger.info(`🎯 Processing subscription activation...`);
    logger.info(`  Subscription ID: ${subscriptionId}`);
    logger.info(`  Telegram ID from event: ${telegramId}`);

    // ===== CRITICAL FIX: Fetch subscription details from PayPal if custom_id missing =====
    if (!telegramId) {
      logger.warn(`⚠️ custom_id NOT in webhook event. Fetching from PayPal API...`);
      
      try {
        const paypalService = new PayPalService();
        const subscriptionDetails = await paypalService.getSubscriptionDetails(subscriptionId);
        
        telegramId = subscriptionDetails.custom_id;
        logger.info(`✅ Fetched custom_id from PayPal API: ${telegramId}`);
        
        if (!telegramId) {
          logger.error(`❌ custom_id still missing after PayPal API call for subscription ${subscriptionId}`);
          return;
        }
      } catch (apiError) {
        logger.warn(`⚠️ Failed to fetch from PayPal API: ${apiError.message}`);
        
        // Fallback: Try to find user by subscription ID
        const user = await User.findOne({ subscriptionId });
        if (user) {
          telegramId = user.telegramId;
          logger.info(`✅ Found user by subscriptionId: ${telegramId}`);
        } else {
          logger.error(`❌ Could not find telegram ID for subscription ${subscriptionId}`);
          return;
        }
      }
    }

    logger.info(`📝 Calling activateSubscription for ${telegramId} with subscription ${subscriptionId}`);
    const user = await SubscriptionService.activateSubscription(
      telegramId,
      subscriptionId
    );

    if (!user) {
      logger.error(`❌ activateSubscription returned null for ${telegramId}`);
      return;
    }

    logger.info(`✅ Subscription activation result:`);
    logger.info(`  subscriptionActive: ${user.subscriptionActive}`);
    logger.info(`  plan: ${user.plan}`);
    logger.info(`  subscriptionExpire: ${user.subscriptionExpire}`);
    logger.info(`  updatedAt: ${user.updatedAt}`);

    if (user.subscriptionActive) {
      logger.success(
        `✅✅✅ User ${telegramId} subscription ACTIVATED! Status: ${user.subscriptionActive}, Plan: ${user.plan}, Expires: ${user.subscriptionExpire}`
      );

      // Determine plan message based on user.plan
      const planMessage = user.plan === "premium" 
        ? "🚀 PREMIUM Unlimited" 
        : user.plan === "pro" 
        ? "💎 PRO 90 queries/day" 
        : "🆓 FREE";

      try {
        await bot.sendMessage(
          telegramId,
          "🎉 <b>Subscription Activated!</b>\n\n" +
            "✨ <b>Unlimited AI unlocked!</b>\n" +
            "You now have access to all premium features.\n" +
            `📊 Plan: ${planMessage}\n` +
            "⏱️ Expires: " + (user.subscriptionExpire?.toLocaleDateString() || "N/A") + "\n\n" +
            "Use /verify to confirm or /ai to start asking questions!",
          { parse_mode: "HTML" }
        );
      } catch (err) {
        logger.warn(`Failed to send activation message to ${telegramId}`, err.message);
      }
    } else {
      logger.error(
        `❌❌❌ CRITICAL: Subscription activation FAILED for ${telegramId}!`
      );
      logger.error(
        `  User found: ${user ? "YES" : "NO"}`
      );
      logger.error(
        `  subscriptionActive: ${user?.subscriptionActive}`
      );
      logger.error(
        `  MongoDB updated: Check if user.updatedAt is recent`
      );
    }
  } catch (error) {
    logger.error("❌ Failed to handle subscription activation", error);
  }
}

/**
 * Handle monthly payment completed event
 */
async function handlePaymentCompleted(event, bot) {
  try {
    const subscriptionId = event.resource.billing_agreement_id;

    const user = await User.findOne({ subscriptionId });

    if (user) {
      const renewed = await SubscriptionService.renewSubscription(subscriptionId);

      if (renewed) {
        try {
          await bot.sendMessage(
            user.telegramId,
            "💳 Monthly Payment Received\n\n" +
              "✅ Your subscription has been renewed\n" +
              "Your AI usage has been reset\n\n" +
              "Thank you for your continued support!"
          );
        } catch (err) {
          logger.warn(`Failed to send payment message to ${user.telegramId}`);
        }
      }
    }
  } catch (error) {
    logger.error("Failed to handle payment completion", error);
  }
}

/**
 * Handle subscription cancellation or expiry event
 */
async function handleSubscriptionCancelled(event, bot) {
  try {
    const subscriptionId = event.resource.id;

    logger.info(`❌ Processing cancellation for subscription: ${subscriptionId}`);

    // Find user by subscription ID first
    let user = await User.findOne({ subscriptionId });

    // If not found by subscription ID, try to fetch from PayPal API
    if (!user) {
      logger.warn(`⚠️ User not found by subscriptionId. Fetching from PayPal API...`);
      
      try {
        const paypalService = new PayPalService();
        const subscriptionDetails = await paypalService.getSubscriptionDetails(subscriptionId);
        
        const telegramId = subscriptionDetails.custom_id;
        if (telegramId) {
          user = await User.findOne({ telegramId });
          logger.info(`✅ Found user via PayPal API custom_id: ${telegramId}`);
        }
      } catch (apiError) {
        logger.warn(`⚠️ Failed to fetch from PayPal API: ${apiError.message}`);
      }
    }

    if (user) {
      // Now cancel using the telegramId
      const cancelled = await SubscriptionService.cancelSubscription(user.telegramId);

      if (cancelled) {
        logger.success(`✅ Subscription cancelled for user ${user.telegramId}`);
        
        try {
          await bot.sendMessage(
            user.telegramId,
            "⚠️ <b>Subscription Cancelled</b>\n\n" +
              "Your premium subscription has been cancelled.\n" +
              "You now have access to the free tier only.\n\n" +
              "Free Plan: 5 queries/day\n\n" +
              "Use /upgrade to resubscribe anytime!",
            { parse_mode: "HTML" }
          );
        } catch (err) {
          logger.warn(`Failed to send cancellation message to ${user.telegramId}`);
        }
      }
    } else {
      logger.warn(`⚠️ User not found for cancelled subscription ${subscriptionId}`);
    }
  } catch (error) {
    logger.error("Failed to handle subscription cancellation", error);
  }
}

export default handlePayPalWebhook;
