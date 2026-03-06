import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { PLANS, SUBSCRIPTION_DURATION_MONTHS } from "../utils/constants.js";
import { logger } from "../utils/logger.js";

/**
 * Subscription Service
 * Handles subscription lifecycle management
 */

export class SubscriptionService {
  /**
   * Create or get user
   */
  static async findOrCreateUser(telegramId, userData = {}) {
    try {
      let user = await User.findOne({ telegramId });

      if (!user) {
        user = await User.create({
          telegramId,
          ...userData,
        });
        logger.info(`New user created: ${telegramId}`);
      }

      return user;
    } catch (error) {
      logger.error(`Failed to find or create user ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Activate subscription
   */
  static async activateSubscription(
    telegramId,
    subscriptionId,
    durationMonths = SUBSCRIPTION_DURATION_MONTHS
  ) {
    try {
      logger.info(`\ud83d\udd17 [1/5] Looking up user: ${telegramId}`);
      const user = await User.findOne({ telegramId });

      if (!user) {
        logger.error(`\u274c [1/5] User NOT FOUND for subscription activation: ${telegramId}`);
        return null;
      }
      logger.success(`\u2705 [1/5] User found: ${user._id}`);

      logger.info(`\ud83d\udd17 [2/5] Calculating expiry date...`);
      const expire = new Date();
      expire.setMonth(expire.getMonth() + durationMonths);
      logger.info(`\ud83d\udd17 [2/5] Expiry date set to: ${expire.toISOString()}`);

      logger.info(`\ud83d\udd17 [3/5] Updating MongoDB with subscription data...`);
      const updated = await User.findOneAndUpdate(
        { telegramId },
        {
          subscriptionActive: true,
          subscriptionId,
          subscriptionExpire: expire,
          plan: PLANS.PRO,
          aiUsage: 0,
          lastUsageReset: new Date(),
        },
        { new: true }
      );

      logger.success(`\u2705 [3/5] MongoDB update completed`);

      if (!updated) {
        logger.error(`\u274c [4/5] DATABASE ERROR: findOneAndUpdate returned null for ${telegramId}`);
        return null;
      }

      logger.info(`\ud83d\udd17 [4/5] Verifying saved data:`);
      logger.info(`    - subscriptionActive: ${updated.subscriptionActive}`);
      logger.info(`    - subscriptionId: ${updated.subscriptionId}`);
      logger.info(`    - plan: ${updated.plan}`);
      logger.info(`    - subscriptionExpire: ${updated.subscriptionExpire}`);

      if (!updated.subscriptionActive) {
        logger.error(`\u274c [5/5] CRITICAL: subscriptionActive is still FALSE after update!`);
        return updated;
      }

      logger.success(
        `\u2705\u2705\u2705 [5/5] Subscription SUCCESSFULLY activated for ${telegramId}`
      );
      return updated;
    } catch (error) {
      logger.error(`\u274c [ERROR] Failed to activate subscription for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(telegramId) {
    try {
      const updated = await User.findOneAndUpdate(
        { telegramId },
        {
          subscriptionActive: false,
          plan: PLANS.FREE,
        },
        { new: true }
      );

      if (updated) {
        logger.info(`Subscription cancelled for user ${telegramId}`);
      }

      return updated;
    } catch (error) {
      logger.error(`Failed to cancel subscription for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Renew subscription (for monthly payments)
   */
  static async renewSubscription(subscriptionId) {
    try {
      const user = await User.findOne({ subscriptionId });

      if (!user) {
        logger.warn(`User not found for subscription renewal: ${subscriptionId}`);
        return null;
      }

      const expire = new Date();
      expire.setMonth(expire.getMonth() + SUBSCRIPTION_DURATION_MONTHS);

      const updated = await User.findOneAndUpdate(
        { subscriptionId },
        {
          subscriptionExpire: expire,
          aiUsage: 0,
          lastUsageReset: new Date(),
        },
        { new: true }
      );

      logger.success(`Subscription renewed for user ${user.telegramId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to renew subscription ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Check and deactivate expired subscriptions
   */
  static async checkAndDeactivateExpired() {
    try {
      const now = new Date();

      const expired = await User.find({
        subscriptionActive: true,
        subscriptionExpire: { $lt: now },
      });

      if (expired.length === 0) {
        return [];
      }

      const deactivated = [];

      for (const user of expired) {
        user.subscriptionActive = false;
        user.plan = PLANS.FREE;
        await user.save();
        deactivated.push(user);

        logger.warn(
          `⏰ Subscription expired for user ${user.telegramId}: ${user.subscriptionExpire}`
        );
      }

      logger.info(
        `⏰ Auto-deactivated ${deactivated.length} expired subscriptions`
      );
      return deactivated;
    } catch (error) {
      logger.error("Failed to check expired subscriptions", error);
      throw error;
    }
  }

  /**
   * Check and send expiry warnings (24 hours before expiry)
   */
  static async checkAndNotifyExpiringSubscriptions(bot) {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find subscriptions expiring in next 24 hours
      const expiring = await User.find({
        subscriptionActive: true,
        subscriptionExpire: {
          $gte: now,
          $lte: in24Hours,
        },
        subscriptionNotified: { $ne: true },
      });

      if (expiring.length === 0) {
        return [];
      }

      const notified = [];

      for (const user of expiring) {
        try {
          const hoursLeft = Math.round(
            (user.subscriptionExpire - now) / (1000 * 60 * 60)
          );

          await bot.sendMessage(
            user.telegramId,
            `⏰ <b>Subscription Expiring Soon!</b>\n\n` +
              `Your PRO subscription expires in <b>${hoursLeft} hours</b>.\n` +
              `Expiry Date: ${user.subscriptionExpire?.toLocaleDateString()}\n\n` +
              `Use /upgrade to renew your subscription and continue enjoying unlimited AI queries!`,
            { parse_mode: "HTML" }
          );

          user.subscriptionNotified = true;
          await user.save();
          notified.push(user);

          logger.info(
            `📧 Expiry warning sent to user ${user.telegramId} (${hoursLeft}h left)`
          );
        } catch (err) {
          logger.warn(`Failed to send expiry notification to ${user.telegramId}`, err.message);
        }
      }

      if (notified.length > 0) {
        logger.success(
          `📧 Sent ${notified.length} subscription expiry warnings`
        );
      }

      return notified;
    } catch (error) {
      logger.error("Failed to check expiring subscriptions", error);
      throw error;
    }
  }

  /**
   * Reset notification flag for renewed subscriptions
   */
  static async resetExpiryNotifications() {
    try {
      const updated = await User.updateMany(
        { subscriptionNotified: true, subscriptionActive: true },
        { subscriptionNotified: false }
      );

      if (updated.modifiedCount > 0) {
        logger.info(
          `🔄 Reset notification flags for ${updated.modifiedCount} users`
        );
      }

      return updated.modifiedCount;
    } catch (error) {
      logger.error("Failed to reset notification flags", error);
      throw error;
    }
  }

  /**
   * Check and activate pending subscriptions (fallback for webhook failures)
   */
  static async checkAndActivatePending() {
    try {
      const pending = await User.find({
        subscriptionId: { $ne: null },
        subscriptionActive: false,
      });

      if (pending.length === 0) {
        return [];
      }

      const activated = [];

      for (const user of pending) {
        try {
          // Mark as active if it has a subscription ID but wasn't activated
          user.subscriptionActive = true;
          user.plan = PLANS.PRO;
          
          if (!user.subscriptionExpire) {
            const expire = new Date();
            expire.setMonth(expire.getMonth() + SUBSCRIPTION_DURATION_MONTHS);
            user.subscriptionExpire = expire;
          }
          
          await user.save();
          activated.push(user);
          
          logger.success(
            `✅ Auto-activated pending subscription for user ${user.telegramId}`
          );
        } catch (err) {
          logger.warn(
            `Failed to auto-activate subscription for ${user.telegramId}`,
            err
          );
        }
      }

      if (activated.length > 0) {
        logger.success(
          `Auto-activated ${activated.length} pending subscriptions`
        );
      }

      return activated;
    } catch (error) {
      logger.error("Failed to check pending subscriptions", error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    try {
      const totalUsers = await User.countDocuments();
      const activeSubscriptions = await User.countDocuments({
        subscriptionActive: true,
      });
      const totalRevenue = await User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totalSpent" },
          },
        },
      ]);

      return {
        totalUsers,
        activeSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
      };
    } catch (error) {
      logger.error("Failed to get stats", error);
      throw error;
    }
  }
}

export default SubscriptionService;
