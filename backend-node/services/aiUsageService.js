import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * AI Usage & Query Limit Service
 * Tracks user queries and enforces rate limits
 */

export class AIUsageService {
  /**
   * Query limit constants
   */
  static LIMITS = {
    FREE: {
      queriesPerDay: 5,
      queriesPerMonth: 100,
      queriesPerHour: 5,
    },
    PRO: {
      queriesPerDay: 90,
      queriesPerMonth: 2500,
      queriesPerHour: 50,
    },
    PREMIUM: {
      queriesPerDay: 999999,
      queriesPerMonth: 5000,
      queriesPerHour: 999999,
    },
  };

  /**
   * Check if user can perform a query
   */
  static async canPerformQuery(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return {
          allowed: false,
          reason: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      const limits = user.plan === "premium" ? this.LIMITS.PREMIUM : (user.plan === "pro" ? this.LIMITS.PRO : this.LIMITS.FREE);
      const now = new Date();

      // ===== Daily Limit Check =====
      if (user.queryResetDaily < now) {
        user.queriesUsedToday = 0;
        user.queryResetDaily = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await user.save();
      }

      if (user.queriesUsedToday >= limits.queriesPerDay) {
        return {
          allowed: false,
          reason: `Daily limit reached (${limits.queriesPerDay}/day)`,
          code: "DAILY_LIMIT",
          used: user.queriesUsedToday,
          limit: limits.queriesPerDay,
          resetAt: user.queryResetDaily,
        };
      }

      // ===== Hourly Rate Limit Check =====
      if (user.queryResetHourly < now) {
        user.queriesUsedHourly = 0;
        user.queryResetHourly = new Date(now.getTime() + 60 * 60 * 1000);
        await user.save();
      }

      if (user.queriesUsedHourly >= limits.queriesPerHour) {
        return {
          allowed: false,
          reason: `Hourly limit reached (${limits.queriesPerHour}/hour)`,
          code: "HOURLY_LIMIT",
          used: user.queriesUsedHourly,
          limit: limits.queriesPerHour,
          resetAt: user.queryResetHourly,
        };
      }

      // ===== Monthly Limit Check =====
      if (user.queryResetMonthly < now) {
        user.queriesUsedMonthly = 0;
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        user.queryResetMonthly = nextMonth;
        await user.save();
      }

      if (user.queriesUsedMonthly >= limits.queriesPerMonth) {
        return {
          allowed: false,
          reason: `Monthly limit reached (${limits.queriesPerMonth}/month)`,
          code: "MONTHLY_LIMIT",
          used: user.queriesUsedMonthly,
          limit: limits.queriesPerMonth,
          resetAt: user.queryResetMonthly,
        };
      }

      return {
        allowed: true,
        daily: { used: user.queriesUsedToday, limit: limits.queriesPerDay },
        hourly: { used: user.queriesUsedHourly, limit: limits.queriesPerHour },
        monthly: { used: user.queriesUsedMonthly, limit: limits.queriesPerMonth },
      };
    } catch (error) {
      logger.error(`Failed to check query limit for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Record a query usage
   */
  static async recordQuery(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        throw new Error("User not found");
      }

      user.queriesUsedToday = (user.queriesUsedToday || 0) + 1;
      user.queriesUsedHourly = (user.queriesUsedHourly || 0) + 1;
      user.queriesUsedMonthly = (user.queriesUsedMonthly || 0) + 1;
      user.totalQueries = (user.totalQueries || 0) + 1;
      user.lastQuery = new Date();

      await user.save();

      logger.info(
        `📊 Query recorded for ${telegramId}: Daily ${user.queriesUsedToday}`
      );

      return user;
    } catch (error) {
      logger.error(`Failed to record query for ${telegramId}`, error);
      throw error;
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

      const limits = user.plan === "premium" ? this.LIMITS.PREMIUM : (user.plan === "pro" ? this.LIMITS.PRO : this.LIMITS.FREE);

      return {
        plan: user.plan,
        daily: {
          used: user.queriesUsedToday || 0,
          limit: limits.queriesPerDay,
          percentage: Math.round(
            ((user.queriesUsedToday || 0) / limits.queriesPerDay) * 100
          ),
        },
        hourly: {
          used: user.queriesUsedHourly || 0,
          limit: limits.queriesPerHour,
          percentage: Math.round(
            ((user.queriesUsedHourly || 0) / limits.queriesPerHour) * 100
          ),
        },
        monthly: {
          used: user.queriesUsedMonthly || 0,
          limit: limits.queriesPerMonth,
          percentage: Math.round(
            ((user.queriesUsedMonthly || 0) / limits.queriesPerMonth) * 100
          ),
        },
        totalQueries: user.totalQueries || 0,
      };
    } catch (error) {
      logger.error(`Failed to get usage summary for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Reset all query counters (for testing/admin)
   */
  static async resetCounters(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        throw new Error("User not found");
      }

      user.queriesUsedToday = 0;
      user.queriesUsedHourly = 0;
      user.queriesUsedMonthly = 0;
      user.queryResetDaily = new Date();
      user.queryResetHourly = new Date();
      user.queryResetMonthly = new Date();

      await user.save();

      logger.info(`🔄 Query counters reset for ${telegramId}`);
      return user;
    } catch (error) {
      logger.error(`Failed to reset counters for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Get warning message for limit
   */
  static getWarningMessage(checkResult) {
    if (checkResult.allowed) {
      return null;
    }

    const remainingMinutes = Math.ceil(
      (checkResult.resetAt - new Date()) / (1000 * 60)
    );

    switch (checkResult.code) {
      case "DAILY_LIMIT":
        return (
          `⚠️ <b>Daily Limit Reached</b>\n\n` +
          `You've used <b>${checkResult.used}/${checkResult.limit}</b> queries today.\n` +
          `Reset in: <b>${remainingMinutes} minutes</b>\n\n` +
          `Upgrade to <b>Pro</b> for <b>90 queries/day</b> - Use /upgrade`
        );

      case "HOURLY_LIMIT":
        return (
          `⚠️ <b>Hourly Rate Limit</b>\n\n` +
          `You've used <b>${checkResult.used}/${checkResult.limit}</b> queries this hour.\n` +
          `Please wait <b>${remainingMinutes} minutes</b> before the next query.\n\n` +
          `Upgrade to <b>Pro</b> for <b>50 queries/hour</b> - Use /upgrade`
        );

      case "MONTHLY_LIMIT":
        return (
          `⚠️ <b>Monthly Limit Reached</b>\n\n` +
          `You've used <b>${checkResult.used}/${checkResult.limit}</b> queries this month.\n` +
          `Reset in: <b>${remainingMinutes} minutes</b>\n\n` +
          `Upgrade to <b>Pro</b> for <b>2500 queries/month</b> - Use /upgrade`
        );

      default:
        return `❌ <b>${checkResult.reason}</b>\n\nUse /upgrade to get more queries`;
    }
  }
}

export default AIUsageService;
