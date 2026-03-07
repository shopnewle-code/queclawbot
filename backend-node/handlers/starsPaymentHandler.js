/**
 * Telegram Stars Payment Handler
 * Handles in-app payments using Telegram Stars (XTR currency)
 */

import { logger } from "../utils/logger.js";
import SubscriptionService from "../services/subscriptionService.js";
import { PLANS } from "../utils/constants.js";

/**
 * Register Telegram Stars payment handlers
 */
export function registerStarsPaymentHandlers(bot) {
  // Handle pre-checkout queries (user approves payment in Telegram)
  bot.on("pre_checkout_query", handlePreCheckoutQuery(bot));

  // Handle successful payments
  bot.on("message", handleSuccessfulPayment(bot));

  logger.success("✅ Telegram Stars payment handlers registered");
}

/**
 * Handle pre-checkout query
 * Telegram asks bot to confirm payment before charging
 */
function handlePreCheckoutQuery(bot) {
  return async (query) => {
    try {
      const { id: queryId, from, invoice_payload } = query;

      logger.info(`💳 Pre-checkout query from user ${from.id}`);
      logger.info(`   Payload: ${invoice_payload}`);

      // Validate payload
      const payloadData = JSON.parse(invoice_payload);
      
      if (!payloadData.plan || !payloadData.userId) {
        logger.warn(`❌ Invalid payload: ${invoice_payload}`);
        await bot.answerPreCheckoutQuery(queryId, false, {
          error_message: "Invalid payment data"
        });
        return;
      }

      // Verify user exists
      const user = await SubscriptionService.findOrCreateUser(from.id.toString());
      if (!user) {
        logger.error(`❌ User not found for checkout: ${from.id}`);
        await bot.answerPreCheckoutQuery(queryId, false, {
          error_message: "User not found"
        });
        return;
      }

      logger.success(`✅ Pre-checkout approved for user ${from.id}`);
      
      // Approve the payment
      await bot.answerPreCheckoutQuery(queryId, true);
    } catch (error) {
      logger.error("Pre-checkout query error", error);
      try {
        await bot.answerPreCheckoutQuery(query.id, false, {
          error_message: "Payment processing error"
        });
      } catch (err) {
        logger.error("Failed to answer pre-checkout query", err);
      }
    }
  };
}

/**
 * Handle successful payment
 */
function handleSuccessfulPayment(bot) {
  return async (msg) => {
    try {
      if (!msg.successful_payment) {
        return;
      }

      const userId = msg.from.id.toString();
      const payment = msg.successful_payment;
      const totalAmount = payment.total_amount; // Amount in Stars

      logger.success(`✅ SUCCESSFUL PAYMENT`);
      logger.success(`   User: ${userId}`);
      logger.success(`   Amount: ⭐${totalAmount}`);
      logger.success(`   Currency: ${payment.currency}`);
      logger.success(`   Provider: ${payment.provider_payment_charge_id}`);

      try {
        // Parse invoice payload to get plan
        const payload = JSON.parse(payment.invoice_payload);
        const plan = payload.plan;

        logger.info(`📋 Activating plan: ${plan}`);

        // Activate subscription
        const user = await SubscriptionService.activateSubscription(userId, null, {
          paymentMethod: "TELEGRAM_STARS",
          starsAmount: totalAmount,
          providerChargeId: payment.provider_payment_charge_id,
        });

        if (user && user.subscriptionActive) {
          logger.success(`✅ User ${userId} subscription activated via Telegram Stars`);

          // Send success message
          const planMessage = 
            plan === "pro" ? "💎 PRO (90 queries/day)" :
            plan === "ultra" ? "🚀 ULTRA (Unlimited)" :
            "🆓 FREE";

          await bot.sendMessage(
            msg.chat.id,
            `🎉 <b>Payment Successful!</b>\n\n` +
            `✅ Your subscription has been activated!\n` +
            `⭐ You paid: ${totalAmount} Telegram Stars\n\n` +
            `📊 <b>Your Plan:</b> ${planMessage}\n` +
            `⏱️ <b>Expires:</b> ${user.subscriptionExpire?.toLocaleDateString() || "N/A"}\n\n` +
            `Use /ai to start asking questions!\n` +
            `Use /verify to check your status anytime.`,
            { parse_mode: "HTML" }
          );
        } else {
          logger.error(`❌ Failed to activate subscription for user ${userId}`);
          await bot.sendMessage(
            msg.chat.id,
            `❌ <b>Payment Received But Activation Failed</b>\n\n` +
            `We received your ⭐${totalAmount} payment but couldn't activate your subscription.\n\n` +
            `Please contact support with your transaction ID:\n` +
            `<code>${payment.provider_payment_charge_id}</code>`,
            { parse_mode: "HTML" }
          );
        }
      } catch (error) {
        logger.error("Error processing Telegram Stars payment", error);
        await bot.sendMessage(
          msg.chat.id,
          `⚠️ <b>Payment Received</b>\n\n` +
          `Your ⭐${totalAmount} payment was successful!\n` +
          `Your subscription is being activated. Please try /verify in a moment.`,
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      logger.error("Successful payment handler error", error);
    }
  };
}

export default registerStarsPaymentHandlers;
