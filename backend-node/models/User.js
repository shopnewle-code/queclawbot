import mongoose from "mongoose";
import { PLANS } from "../utils/constants.js";

/**
 * User Model
 * Stores user data with subscription and AI usage tracking
 */

const userSchema = new mongoose.Schema(
  {
    // Telegram Information
    telegramId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    username: String,
    firstName: String,
    lastName: String,
    profilePhoto: String,

    // Subscription Information
    subscriptionActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    subscriptionId: String,
    subscriptionExpire: Date,

    // Plan and Usage
    plan: {
      type: String,
      enum: [PLANS.FREE, PLANS.PRO, PLANS.PREMIUM],
      default: PLANS.FREE,
      index: true,
    },

    aiUsage: {
      type: Number,
      default: 0,
    },

    lastUsageReset: Date,

    // Payment History
    totalSpent: {
      type: Number,
      default: 0,
    },

    paymentHistory: [
      {
        amount: Number,
        currency: String,
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Query Tracking (Rate Limiting & Usage Tracking)
    queriesUsedToday: {
      type: Number,
      default: 0,
    },
    queriesUsedHourly: {
      type: Number,
      default: 0,
    },
    queriesUsedMonthly: {
      type: Number,
      default: 0,
    },
    totalQueries: {
      type: Number,
      default: 0,
    },
    queryResetDaily: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    queryResetHourly: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
    },
    queryResetMonthly: {
      type: Date,
      default: () => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        return next;
      },
    },
    lastQuery: Date,

    // Webhook Deduplication (prevent duplicate processing)
    processedWebhookIds: [
      {
        type: String,
        index: true,
      },
    ],
    lastWebhookId: String,
    lastWebhookTime: Date,

    // Subscription Notifications
    subscriptionNotified: {
      type: Boolean,
      default: false,
    },

    // Referral System
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: String,
    referralCount: {
      type: Number,
      default: 0,
    },
    referralReward: {
      type: Number,
      default: 0,
    },

    // User Settings
    language: {
      type: String,
      default: "en",
    },
    timezone: String,
    notifications: {
      type: Boolean,
      default: true,
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    lastInteraction: Date,
    ipAddresses: [String],

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ createdAt: -1 });
userSchema.index({ lastInteraction: -1 });
userSchema.index({ subscriptionActive: 1, subscriptionExpire: 1 });

// Methods
userSchema.methods.hasUnlimitedAI = function () {
  return this.subscriptionActive && this.plan === PLANS.PRO;
};

userSchema.methods.canUseAI = function (limit) {
  if (this.hasUnlimitedAI()) return true;
  return this.aiUsage < limit;
};

userSchema.methods.increaseUsage = function () {
  this.aiUsage += 1;
  return this.save();
};

userSchema.methods.resetUsage = function () {
  this.aiUsage = 0;
  this.lastUsageReset = new Date();
  return this.save();
};

userSchema.methods.activateSubscription = function (
  subscriptionId,
  durationMonths = 1
) {
  this.subscriptionActive = true;
  this.subscriptionId = subscriptionId;
  this.plan = PLANS.PRO;

  const expire = new Date();
  expire.setMonth(expire.getMonth() + durationMonths);
  this.subscriptionExpire = expire;

  this.aiUsage = 0;
  return this.save();
};

userSchema.methods.cancelSubscription = function () {
  this.subscriptionActive = false;
  this.plan = PLANS.FREE;
  return this.save();
};

export const User = mongoose.model("User", userSchema);

export default User;
