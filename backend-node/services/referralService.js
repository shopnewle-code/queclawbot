import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Referral System Service
 * Manages user referrals and rewards
 */

export class ReferralService {
  /**
   * Generate unique referral code for user
   */
  static async generateReferralCode(telegramId) {
    try {
      let code = null;
      let isUnique = false;

      // Generate unique code
      while (!isUnique) {
        code = `ref_${telegramId}_${Math.random().toString(36).substring(7)}`;
        const existing = await User.findOne({ referralCode: code });
        isUnique = !existing;
      }

      const user = await User.findOne({ telegramId });
      if (user) {
        user.referralCode = code;
        await user.save();
        logger.info(`Generated referral code for ${telegramId}: ${code}`);
      }

      return code;
    } catch (error) {
      logger.error(`Failed to generate referral code for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Get or create referral code
   */
  static async getReferralCode(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.referralCode) {
        return this.generateReferralCode(telegramId);
      }

      return user.referralCode;
    } catch (error) {
      logger.error(`Failed to get referral code for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Track referral and apply rewards
   */
  static async applyReferral(newUserTelegramId, referralCode) {
    try {
      // Find referrer
      const referrer = await User.findOne({ referralCode });

      if (!referrer) {
        logger.warn(
          `Invalid referral code: ${referralCode} for new user ${newUserTelegramId}`
        );
        return null;
      }

      // Find new user
      const newUser = await User.findOne({ telegramId: newUserTelegramId });

      if (!newUser || newUser.referredBy) {
        logger.warn(`Cannot apply referral to ${newUserTelegramId}`);
        return null;
      }

      // Apply referral
      newUser.referredBy = referrer.telegramId;
      await newUser.save();

      // Update referrer stats
      referrer.referralCount = (referrer.referralCount || 0) + 1;

      // ===== Referral Rewards =====
      // Reward: 7 days free pro for both users
      if (referrer.referralCount === 1) {
        // First referral bonus
        referrer.referralReward = (referrer.referralReward || 0) + 7;
        logger.success(
          `🎁 Referrer ${referrer.telegramId} earned 7 days bonus (1st referral)`
        );
      } else if (referrer.referralCount % 3 === 0) {
        // Every 3 referrals
        referrer.referralReward = (referrer.referralReward || 0) + 7;
        logger.success(
          `🎁 Referrer ${referrer.telegramId} earned 7 days bonus (${referrer.referralCount} referrals)`
        );
      }

      await referrer.save();

      logger.info(
        `✅ Applied referral: ${newUserTelegramId} referred by ${referrer.telegramId}`
      );

      return {
        referrer,
        newUser,
        reward: referrer.referralReward,
      };
    } catch (error) {
      logger.error(
        `Failed to apply referral for ${newUserTelegramId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get referral stats for user
   */
  static async getReferralStats(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        throw new Error("User not found");
      }

      const code = user.referralCode || (await this.generateReferralCode(telegramId));
      const referredUsers = await User.countDocuments({ referredBy: telegramId });

      return {
        code,
        invitations: user.referralCount || 0,
        sentTo: referredUsers,
        reward: user.referralReward || 0,
        referralLink: `https://t.me/queclawbot?start=${code}`,
      };
    } catch (error) {
      logger.error(`Failed to get referral stats for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Claim referral rewards (convert to subscription)
   */
  static async claimReferralReward(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        throw new Error("User not found");
      }

      const rewardDays = user.referralReward || 0;

      if (rewardDays === 0) {
        return {
          success: false,
          message: "No rewards to claim",
        };
      }

      // Activate subscription with reward days
      const expire = new Date();
      expire.setDate(expire.getDate() + rewardDays);

      user.subscriptionActive = true;
      user.plan = "pro";
      user.subscriptionExpire = expire;
      user.referralReward = 0; // Reset rewards
      await user.save();

      logger.success(
        `🎁 ${telegramId} claimed referral reward: ${rewardDays} days free PRO`
      );

      return {
        success: true,
        message: `🎁 You claimed ${rewardDays} days FREE PRO subscription!`,
        expireDate: expire,
      };
    } catch (error) {
      logger.error(
        `Failed to claim referral reward for ${telegramId}`,
        error
      );
      throw error;
    }
  }
}

export default ReferralService;
