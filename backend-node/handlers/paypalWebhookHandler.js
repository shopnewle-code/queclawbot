import { PAYPAL_EVENTS } from "../utils/constants.js";
import { User } from "../models/User.js";
import SubscriptionService from "../services/subscriptionService.js";
import { logger } from "../utils/logger.js";

/**
 * PayPal Webhook Handler
 * Processes PayPal subscription and payment events
 */

export async function handlePayPalWebhook(event, bot) {
  try {
    logger.info(`📩 PayPal Event: ${event.event_type}`);

    switch (event.event_type) {
      case PAYPAL_EVENTS.ACTIVATION:
        await handleSubscriptionActivation(event, bot);
        break;

      case PAYPAL_EVENTS.PAYMENT_COMPLETED:
        await handlePaymentCompleted(event, bot);
        break;

      case PAYPAL_EVENTS.CANCELLED:
      case PAYPAL_EVENTS.EXPIRED:
        await handleSubscriptionCancelled(event, bot);
        break;

      default:
        logger.debug(`Unhandled PayPal event: ${event.event_type}`);
    }

    return true;
  } catch (error) {
    logger.error("PayPal webhook error", error);
    return false;
  }
}

/**
 * Handle subscription activation event
 */
async function handleSubscriptionActivation(event, bot) {
  try {
    const telegramId = event.resource.custom_id;
    const subscriptionId = event.resource.id;

    logger.info(`Activating subscription: ${subscriptionId} for user ${telegramId}`);

    const user = await SubscriptionService.activateSubscription(
      telegramId,
      subscriptionId
    );

    if (user && user.subscriptionActive) {
      logger.success(
        `✅ User ${telegramId} subscription status: ${user.subscriptionActive}`
      );

      try {
        await bot.sendMessage(
          telegramId,
          "🎉 Subscription Activated!\n\n" +
            "✨ <b>Unlimited AI unlocked!</b>\n" +
            "You now have access to all premium features.\n" +
            "📊 Plan: 🌟 PRO\n" +
            "⏱️ Duration: 30 days\n\n" +
            "Use /ai &lt;prompt&gt; to start asking questions!"
        );
      } catch (err) {
        logger.warn(`Failed to send activation message to ${telegramId}`, err);
      }
    } else {
      logger.error(
        `Failed to activate subscription for ${telegramId}: user not found or not activated`
      );
    }
  } catch (error) {
    logger.error("Failed to handle subscription activation", error);
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

    // Find user by subscription ID first
    const user = await User.findOne({ subscriptionId });

    if (user) {
      // Now cancel using the telegramId
      const cancelled = await SubscriptionService.cancelSubscription(user.telegramId);

      if (cancelled) {
        try {
          await bot.sendMessage(
            user.telegramId,
            "⚠️ Subscription Cancelled\n\n" +
              "Your premium subscription has been cancelled.\n" +
              "You now have access to the free tier only (5 queries/month).\n\n" +
              "Use /upgrade to resubscribe anytime!"
          );
        } catch (err) {
          logger.warn(`Failed to send cancellation message to ${user.telegramId}`);
      }
    }
  } catch (error) {
    logger.error("Failed to handle subscription cancellation", error);
  }
}

export default handlePayPalWebhook;
