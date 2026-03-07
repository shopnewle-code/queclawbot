/**
 * Daily AI Usage Limiter
 * Prevents abuse and ensures fair resource usage
 */

import { User } from "../models/User.js";
import { PLANS } from "../utils/constants.js";
import { logger } from "../utils/logger.js";

export class DailyUsageLimiter {
  /**
   * Usage limits per plan
   */
  static LIMITS = {
    [PLANS.FREE]: 10,      // 10 queries/day
    [PLANS.PRO]: 90,       // 90 queries/day
    [PLANS.PREMIUM]: Infinity, // Unlimited
  };

  /**
   * Check if user can perform query
   */
  static async canPerformQuery(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return {
          allowed: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        };
      }

      // Check if subscription is active
      if (!user.subscriptionActive) {
        return {
          allowed: false,
          code: "SUBSCRIPTION_INACTIVE",
          message: "Subscription is not active",
          plan: user.plan,
        };
      }

      // Check if subscription has expired
      if (user.subscriptionExpire && new Date() > user.subscriptionExpire) {
        // Auto-deactivate expired subscription
        user.subscriptionActive = false;
        await user.save();
        
        return {
          allowed: false,
          code: "SUBSCRIPTION_EXPIRED",
          message: "Subscription has expired",
          expiredAt: user.subscriptionExpire,
        };
      }

      // Get daily limit for plan
      const limit = this.LIMITS[user.plan] || this.LIMITS[PLANS.FREE];

      // Check if daily reset is needed
      const today = new Date().toDateString();
      const lastReset = user.lastUsageReset?.toDateString();

      if (lastReset !== today) {
        // Reset daily usage
        user.queriesUsedToday = 0;
        user.lastUsageReset = new Date();
        await user.save();
      }

      // Check limit
      if (user.queriesUsedToday >= limit) {
        return {
          allowed: false,
          code: "LIMIT_EXCEEDED",
          message: `Daily limit exceeded (${limit} queries/day)`,
          used: user.queriesUsedToday,
          limit: limit,
          plan: user.plan,
          resetsAt: new Date(new Date().setDate(new Date().getDate() + 1)),
        };
      }

      return {
        allowed: true,
        code: "OK",
        plan: user.plan,
        used: user.queriesUsedToday,
        limit: limit,
        remaining: limit - user.queriesUsedToday,
      };
    } catch (error) {
      logger.error("Usage limiter error", error);
      return {
        allowed: false,
        code: "ERROR",
        message: "Usage check failed",
      };
    }
  }

  /**
   * Record a query usage
   */
  static async recordQuery(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return false;
      }

      // Reset if new day
      const today = new Date().toDateString();
      const lastReset = user.lastUsageReset?.toDateString();

      if (lastReset !== today) {
        user.queriesUsedToday = 0;
        user.lastUsageReset = new Date();
      }

      // Increment usage
      user.queriesUsedToday += 1;
      user.totalQueries += 1;
      user.lastQuery = new Date();

      await user.save();

      logger.debug(
        `📊 Query recorded: ${telegramId} (Today: ${user.queriesUsedToday}, Total: ${user.totalQueries})`
      );

      return true;
    } catch (error) {
      logger.error("Failed to record query", error);
      return false;
    }
  }

  /**
   * Get usage summary for user
   */
  static async getUsageSummary(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return null;
      }

      const limit = this.LIMITS[user.plan] || this.LIMITS[PLANS.FREE];

      return {
        plan: user.plan,
        subscriptionActive: user.subscriptionActive,
        subscriptionExpire: user.subscriptionExpire,
        daily: {
          used: user.queriesUsedToday,
          limit: limit,
          remaining: Math.max(0, limit - user.queriesUsedToday),
        },
        totalQueries: user.totalQueries,
        lastQuery: user.lastQuery,
      };
    } catch (error) {
      logger.error("Failed to get usage summary", error);
      return null;
    }
  }

  /**
   * Get warning message based on limit check result
   */
  static getWarningMessage(limitCheck) {
    if (limitCheck.code === "USER_NOT_FOUND") {
      return "❌ Account not found. Please use /start to initialize your account.";
    }

    if (limitCheck.code === "SUBSCRIPTION_INACTIVE") {
      return (
        "❌ <b>Subscription Inactive</b>\n\n" +
        "Your subscription is not active.\n" +
        "Use /upgrade to activate your premium plan.\n\n" +
        "Free Plan: 10 queries/day"
      );
    }

    if (limitCheck.code === "SUBSCRIPTION_EXPIRED") {
      return (
        "⏰ <b>Subscription Expired</b>\n\n" +
        `Your subscription expired on ${new Date(limitCheck.expiredAt).toLocaleDateString()}\n\n` +
        "Use /upgrade to renew your subscription."
      );
    }

    if (limitCheck.code === "LIMIT_EXCEEDED") {
      const resetsIn = this._getTimeUntilReset();
      return (
        `⚠️ <b>Daily Limit Reached</b>\n\n` +
        `Your plan: ${limitCheck.plan}\n` +
        `Daily limit: ${limitCheck.limit} queries\n` +
        `Used today: ${limitCheck.used}/${limitCheck.limit}\n\n` +
        `⏰ Your limit resets in ${resetsIn}\n\n` +
        `Upgrade to <b>PRO</b> (90/day) or <b>UNLIMITED</b> for more queries.`
      );
    }

    return "⚠️ Unable to process your query. Please try again.";
  }

  /**
   * Get time until daily reset
   */
  static _getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }
}

export default DailyUsageLimiter;
