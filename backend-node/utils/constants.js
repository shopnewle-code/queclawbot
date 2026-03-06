/**
 * Application Constants
 * Centralized magic strings, messages, and configurations
 */

export const PLANS = {
  FREE: "free",
  PRO: "pro",
  PREMIUM: "premium",
};

export const TELEGRAM_MESSAGES = {
  UPGRADE_PROMPT: "💎 Upgrade to Pro",
  SUBSCRIBE_BTN: "💳 Subscribe",
  FREE_LIMIT: "Free limit reached\nUse /upgrade",
  SUBSCRIPTION_SUCCESS: "🎉 Subscription Activated!\nUnlimited AI unlocked.",
  PAYMENT_RECEIVED: "💳 Monthly payment received\nSubscription renewed.",
  SUBSCRIPTION_CANCELLED: "⚠️ Subscription cancelled",
  AI_THINKING: "🤖 Thinking...",
  AI_ERROR: "AI server error",
  PAYMENT_ERROR: "Payment server error",
  STATS_TITLE: "📊 Stats",
};

export const BOT_COMMANDS = {
  START: "start",
  AI: "ai",
  UPGRADE: "upgrade",
  STATS: "stats",
  HELP: "help",
  PROFILE: "profile",
};

export const BOT_REGEX = {
  AI: /\/ai (.+)/,
  UPGRADE: /\/upgrade/,
  STATS: /\/stats/,
  HELP: /\/help/,
  PROFILE: /\/profile/,
};

export const PAYPAL_EVENTS = {
  ACTIVATION: "BILLING.SUBSCRIPTION.ACTIVATED",
  PAYMENT_COMPLETED: "PAYMENT.SALE.COMPLETED",
  CANCELLED: "BILLING.SUBSCRIPTION.CANCELLED",
  EXPIRED: "BILLING.SUBSCRIPTION.EXPIRED",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export const SUBSCRIPTION_DURATION_MONTHS = 1;

export default {
  PLANS,
  TELEGRAM_MESSAGES,
  BOT_COMMANDS,
  BOT_REGEX,
  PAYPAL_EVENTS,
  HTTP_STATUS,
  SUBSCRIPTION_DURATION_MONTHS,
};
