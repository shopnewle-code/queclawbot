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
      const user = await User.findOne({ telegramId });

      if (!user) {
        logger.warn(`User not found for subscription activation: ${telegramId}`);
        return null;
      }

      const expire = new Date();
      expire.setMonth(expire.getMonth() + durationMonths);

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

      logger.success(
        `Subscription activated for user ${telegramId}: expires ${expire}`
      );
      return updated;
    } catch (error) {
      logger.error(`Failed to activate subscription for ${telegramId}`, error);
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
        return;
      }

      for (const user of expired) {
        user.subscriptionActive = false;
        user.plan = PLANS.FREE;
        await user.save();
      }

      logger.info(`Deactivated ${expired.length} expired subscriptions`);
      return expired;
    } catch (error) {
      logger.error("Failed to check expired subscriptions", error);
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
