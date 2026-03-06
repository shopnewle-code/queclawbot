import { BOT_REGEX, TELEGRAM_MESSAGES, PLANS } from "../utils/constants.js";
import { env } from "../config/env.js";
import AIService from "../services/aiService.js";
import PayPalService from "../services/paypalService.js";
import SubscriptionService from "../services/subscriptionService.js";
import AIUsageService from "../services/aiUsageService.js";
import ReferralService from "../services/referralService.js";
import { logger } from "../utils/logger.js";

/**
 * Telegram Bot Handlers
 * Handles all telegram bot commands
 */

export function registerBotHandlers(bot) {
  // /start command
  bot.onText(/\/start/, handleStartCommand(bot));

  // /help command
  bot.onText(BOT_REGEX.HELP, handleHelpCommand(bot));

  // /ai <prompt> command
  bot.onText(BOT_REGEX.AI, handleAICommand(bot));

  // /upgrade command
  bot.onText(BOT_REGEX.UPGRADE, handleUpgradeCommand(bot));

  // /stats command (admin only)
  bot.onText(BOT_REGEX.STATS, handleStatsCommand(bot));

  // /profile command
  bot.onText(BOT_REGEX.PROFILE, handleProfileCommand(bot));

  // /verify command (check subscription status after payment)
  bot.onText(/\/verify/, handleVerifyCommand(bot));

  // /imagine <prompt> command (Pro only - image generation)
  bot.onText(/\/imagine\s+(.+)/, handleImagineCommand(bot));

  // /search <query> command (web search)
  bot.onText(/\/search\s+(.+)/, handleSearchCommand(bot));

  // /refer command (referral program)
  bot.onText(/\/refer/, handleReferCommand(bot));

  // /claim command (claim referral rewards)
  bot.onText(/\/claim/, handleClaimCommand(bot));

  // /pricing command (show pricing plans)
  bot.onText(/\/pricing/, handlePricingCommand(bot));

  // Handle callback queries from inline buttons
  bot.on("callback_query", handleCallbackQuery(bot));

  // Handle any message (for advanced features)
  bot.on("message", handleMessage(bot));

  // Handle errors
  bot.on("polling_error", (error) => {
    logger.error("Telegram polling error", error);
  });

  logger.success("✅ Bot handlers registered");
}

/**
 * Handle callback queries from inline buttons
 */
function handleCallbackQuery(bot) {
  return async (query) => {
    const { data, message, from } = query;

    try {
      let responseText = "✅ Processing...";
      let showAlert = false;

      if (data === "help") {
        const helpCmd = handleHelpCommand(bot);
        await helpCmd({ chat: message.chat, from });
      } else if (data === "upgrade" || data === "upgrade_pro") {
        const upgradeCmd = handleUpgradeCommand(bot);
        await upgradeCmd({ chat: message.chat, from });
      } else if (data === "profile") {
        const profileCmd = handleProfileCommand(bot);
        await profileCmd({ chat: message.chat, from });
      } else if (data === "copy_referral") {
        responseText = "� Referral link copied! Share it with friends.";
        showAlert = true;
      } else if (data === "referral_stats") {
        try {
          const telegramId = from.id.toString();
          const stats = await ReferralService.getReferralStats(telegramId);
          responseText =
            `🎁 Your Referral Stats:\n\n` +
            `👥 Friends invited: ${stats.invitations}\n` +
            `🎁 Rewards available: ${stats.reward} days\n` +
            `💎 Completed invites: ${stats.sentTo}\n\n` +
            (stats.reward > 0
              ? `Use /claim to activate your ${stats.reward} days FREE PRO!`
              : `Invite more friends to earn rewards!`);
          showAlert = true;
        } catch (err) {
          responseText = "Failed to load referral stats";
          showAlert = true;
        }
      } else if (data === "claim_reward") {
        try {
          const claimCmd = handleClaimCommand(bot);
          await claimCmd({ chat: message.chat, from });
        } catch (err) {
          responseText = "Failed to claim reward";
          showAlert = true;
        }
      } else if (data === "view_plans") {
        responseText = "🆓 Free: 5 queries/month\n💎 Pro: Unlimited - $4.99/month";
        showAlert = true;
      } else if (data === "view_stats") {
        try {
          const telegramId = from.id.toString();
          const user = await SubscriptionService.findOrCreateUser(telegramId);
          responseText = `📊 Your Stats:\n\nQueries Used: ${user.aiUsage}\nPlan: ${user.plan.toUpperCase()}`;
          showAlert = true;
        } catch (err) {
          responseText = "Failed to load stats";
          showAlert = true;
        }
      } else if (data === "cancel_subscription") {
        try {
          const telegramId = from.id.toString();
          await SubscriptionService.cancelSubscription(telegramId);
          responseText = "✅ Subscription cancelled";
          showAlert = true;
        } catch (err) {
          responseText = "Failed to cancel subscription";
          showAlert = true;
        }
      } else if (data === "paypal_checkout") {
        try {
          const telegramId = from.id.toString();
          const { approvalUrl } = await PayPalService.createSubscription(telegramId);
          // Open PayPal link
          await bot.answerCallbackQuery(query.id, {
            url: approvalUrl,
            text: "🔓 Opening PayPal...",
          });
          return;
        } catch (err) {
          responseText = "Failed to create payment link";
          showAlert = true;
        }
      } else if (data === "show_faq") {
        responseText =
          "❓ FAQ:\n\n" +
          "Q: Can I cancel anytime?\nA: Yes! Cancel anytime in your profile.\n\n" +
          "Q: What payment methods?\nA: PayPal, credit card via PayPal.\n\n" +
          "Q: Refund policy?\nA: 7-day money back guarantee.";
        showAlert = true;
      }

      // Answer callback query with response
      await bot.answerCallbackQuery(query.id, {
        text: responseText,
        show_alert: showAlert,
      });
    } catch (error) {
      logger.error("Callback query error", error);
      await bot.answerCallbackQuery(query.id, {
        text: "❌ Error processing request",
        show_alert: true,
      });
    }
  };
}

/**
 * Handle any message (for advanced features)
 */
function handleMessage(bot) {
  return async (msg) => {
    try {
      const chatType = msg.chat.type;
      const telegramId = msg.from.id.toString();
      const text = msg.text?.toLowerCase() || "";

      // Skip if message is a command (already handled)
      if (text.startsWith("/")) return;

      // Track user activity
      await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });

      // Respond to greetings with enthusiasm
      if (text.match(/^(hi|hello|hey|sup|yo|greetings|hola|bonjour|salaam)\b/)) {
        await bot.sendMessage(
          msg.chat.id,
          "👋 Hey there! 😊 I'm QueClaw AI. Use /ai to ask me anything or /help for commands!",
          { reply_to_message_id: msg.message_id }
        );
        return;
      }

      // Respond to thank you messages
      if (text.match(/^(thanks|thank you|thx|appreciate|thanks!)\b/)) {
        await bot.sendMessage(
          msg.chat.id,
          "🙏 You're welcome! Happy to help! More questions? Just ask!",
          { reply_to_message_id: msg.message_id }
        );
        return;
      }

      // Respond to help requests
      if (text.match(/^(help|support|assist|\?|how|what)\b/)) {
        const helpCmd = handleHelpCommand(bot);
        await helpCmd({ chat: msg.chat, from: msg.from });
        return;
      }

      // Respond to unclear messages with helpful suggestion
      if (text.length > 5 && !msg.reply_to_message) {
        await bot.sendMessage(
          msg.chat.id,
          "💡 Did you mean to ask me a question? Use /ai followed by your question!\n\nExample: /ai What is machine learning?",
          { reply_to_message_id: msg.message_id }
        );
        return;
      }
    } catch (error) {
      logger.error("Message handler error", error);
    }
  };
}

/**
 * Handle /start command
 */
function handleStartCommand(bot) {
  return async (msg) => {
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || "Friend";
    const args = msg.text?.split(" ")[1]; // Get referral code if present

    try {
      // Create user on first interaction
      let user = await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });

      // ===== Handle Referral =====
      if (args && args.startsWith("ref_") && !user.referredBy) {
        try {
          await ReferralService.applyReferral(telegramId, args);
          logger.info(`✅ Applied referral code ${args} to user ${telegramId}`);
        } catch (err) {
          logger.warn(`Failed to apply referral ${args}`, err.message);
        }
      }

      const welcomeText = `
👋 Welcome to <b>QueClaw AI</b>, ${firstName}!

I'm your personal AI assistant powered by advanced language models.

<b>🎯 Quick Start:</b>
• Use /ai to ask any question
• Use /help for all commands
• Use /upgrade for unlimited access

<b>💡 Get Started:</b>
Try: /ai How does machine learning work?

<b>🌟 Premium Features:</b>
Upgrade to Pro for image generation, web search, and unlimited queries - just <b>$4.99/month</b>!
      `;

      await bot.sendMessage(msg.chat.id, welcomeText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "❓ Help", callback_data: "help" },
              { text: "💎 Upgrade", callback_data: "upgrade_pro" },
            ],
            [
              { text: "👤 Profile", callback_data: "profile" },
              { text: "🎁 Refer Friends", callback_data: "referral_stats" },
            ],
          ],
        },
      });

      logger.info(`New user started bot: ${telegramId}${args ? " (via referral)" : ""}`);
    } catch (error) {
      logger.error("Failed to send start message", error);
    }
  };
}

/**
 * Handle /help command
 */
function handleHelpCommand(bot) {
  return async (msg) => {
    const helpText = `
🤖 *QueClaw AI Bot*

*📝 Core Commands:*

/ai <prompt>
Ask AI any question
Example: /ai What is blockchain?

💎 /upgrade
Subscribe to Pro unlimited
Only $4.99/month

✅ /verify
Check your subscription status
After payment, use to verify activation

👤 /profile
View your account & usage

🎁 /refer
Invite friends & earn rewards

*🌟 Pro Features (Upgrade):*

/imagine <description>
Generate AI images
Example: /imagine sunset over mountains

🔍 /search <query>
Search the web for info
Example: /search latest AI news

📊 /stats
View bot statistics (admin)

🆘 /help
Show this message

*💎 Plans:*
🆓 *Free:* 5 queries/month
🌟 *Pro:* Unlimited - $4.99/month

*🚀 Quick Tips:*
1. Start with /ai to test AI
2. Use /profile to check usage
3. /upgrade for unlimited access
4. After payment, use /verify to check status
5. /imagine & /search for Pro users

Questions? Ask me anything! 🤖
    `;

    try {
      await bot.sendMessage(msg.chat.id, helpText, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      logger.error("Failed to send help message", error);
    }
  };
}

/**
 * Handle /ai command
 */
function handleAICommand(bot) {
  return async (msg, match) => {
    try {
      const telegramId = msg.from.id.toString();
      const prompt = match[1]?.trim();

      if (!prompt) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Please provide a prompt.\n\nExample: /ai What is AI?",
          {
            reply_to_message_id: msg.message_id,
          }
        );
        return;
      }

      if (prompt.length > 1000) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Your prompt is too long (max 1000 characters)"
        );
        return;
      }

      // Find or create user
      let user = await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });

      // ===== Query Limit Check =====
      const limitCheck = await AIUsageService.canPerformQuery(telegramId);

      if (!limitCheck.allowed) {
        const warningMsg = AIUsageService.getWarningMessage(limitCheck);
        await bot.sendMessage(msg.chat.id, warningMsg, {
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        });
        logger.warn(
          `❌ Query blocked for ${telegramId}: ${limitCheck.code} (${limitCheck.used}/${limitCheck.limit})`
        );
        return;
      }

      // Send thinking message
      const thinkingMsg = await bot.sendMessage(msg.chat.id, "🤖 Thinking... ⏳");

      try {
        // Call AI service with timeout
        const startTime = Date.now();
        const aiResponse = await Promise.race([
          AIService.askAI(prompt, telegramId),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("AI request timeout (30s)")),
              30000
            )
          ),
        ]);

        const duration = Date.now() - startTime;

        // Record query usage with new system
        await AIUsageService.recordQuery(telegramId);
        const summary = await AIUsageService.getUsageSummary(telegramId);

        logger.info(
          `✅ AI query from ${telegramId} - Daily: ${summary.daily.used}/${summary.daily.limit}, Total: ${summary.totalQueries} - Time: ${duration}ms`
        );

        // Format response with markdown
        let response = aiResponse.reply || aiResponse;

        // Truncate if too long (Telegram limit is 4096)
        if (response.length > 4000) {
          response = response.substring(0, 3990) + "...\n\n*[Response truncated]*";
        }

        // Edit thinking message with actual response
        await bot.editMessageText(
          `*Your Query:*\n\`${prompt}\`\n\n*Response:*\n${response}\n\n⏱️ Response time: ${duration}ms`,
          {
            chat_id: msg.chat.id,
            message_id: thinkingMsg.message_id,
            parse_mode: "Markdown",
          }
        );
      } catch (aiError) {
        logger.error("AI service error", aiError);

        const errorMessage = aiError.message || "Unknown error";
        await bot.editMessageText(
          `❌ *AI Request Failed*\n\n${errorMessage}\n\nPlease try again in a moment.`,
          {
            chat_id: msg.chat.id,
            message_id: thinkingMsg.message_id,
            parse_mode: "Markdown",
          }
        );
      }
    } catch (error) {
      logger.error("AI command error", error);
      await bot.sendMessage(
        msg.chat.id,
        "❌ An error occurred. Please try again."
      );
    }
  };
}

/**
 * Handle /upgrade command
 */
function handleUpgradeCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();

      // Create PayPal subscription
      const { approvalUrl } = await PayPalService.createSubscription(telegramId);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_MESSAGES.SUBSCRIBE_BTN,
              url: approvalUrl,
            },
          ],
          [
            {
              text: "ℹ️ View Plans",
              callback_data: "view_plans",
            },
          ],
        ],
      };

      await bot.sendMessage(
        msg.chat.id,
        TELEGRAM_MESSAGES.UPGRADE_PROMPT +
          "\n\n" +
          "💰 <b>Plans:</b>\n" +
          "• Free: 5 queries/month\n" +
          "• Pro: Unlimited queries - $4.99/month\n\n" +
          "📝 <b>After Payment:</b>\n" +
          "Click the PayPal button below to complete payment.\n" +
          "After successful payment, use <code>/verify</code> to check if your subscription is active!",
        {
          reply_markup: keyboard,
          parse_mode: "HTML",
        }
      );

      logger.info(`Upgrade command used by ${telegramId}`);
    } catch (error) {
      logger.error("Upgrade command error", error);
      await bot.sendMessage(msg.chat.id, "❌ " + TELEGRAM_MESSAGES.PAYMENT_ERROR);
    }
  };
}

/**
 * Handle /stats command (admin only)
 */
function handleStatsCommand(bot) {
  return async (msg) => {
    try {
      if (msg.from.id.toString() !== env.ADMIN_ID) {
        await bot.sendMessage(msg.chat.id, "🚫 You don't have permission to use this command.");
        return;
      }

      const stats = await SubscriptionService.getStats();

      const statsText = `
${TELEGRAM_MESSAGES.STATS_TITLE}

👥 Total Users: ${stats.totalUsers}
💎 Active Subscriptions: ${stats.activeSubscriptions}
💰 Total Revenue: $${stats.totalRevenue.toFixed(2)}

📊 Activity Rate: ${(
        (stats.activeSubscriptions / Math.max(stats.totalUsers, 1)) *
        100
      ).toFixed(1)}%
      `;

      await bot.sendMessage(msg.chat.id, statsText);
      logger.info("Stats requested by admin");
    } catch (error) {
      logger.error("Stats command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to retrieve stats");
    }
  };
}

/**
 * Handle /profile command
 */
function handleProfileCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();

      let user = await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });

      const subscriptionStatus = user.subscriptionActive
        ? `✅ Active (expires ${user.subscriptionExpire?.toLocaleDateString() || "N/A"})`
        : "❌ Inactive";

      const usagePercentage = Math.min(
        Math.round((user.aiUsage / env.AI_USAGE_FREE_LIMIT) * 100),
        100
      );

      const profileText = `
👤 <b>Your Profile</b>

<b>User Info:</b>
Name: ${msg.from.first_name || "User"} ${msg.from.last_name || ""}
Username: @${msg.from.username || "N/A"}

<b>Subscription:</b>
💎 Plan: ${user.plan === PLANS.PRO ? "🌟 PRO" : "🆓 FREE"}
Status: ${subscriptionStatus}

<b>Usage:</b>
📊 AI Queries: ${user.aiUsage}/${user.plan === PLANS.PRO ? "Unlimited ∞" : env.AI_USAGE_FREE_LIMIT}
📈 Usage: ${usagePercentage}%

<b>Account:</b>
📅 Joined: ${user.createdAt?.toLocaleDateString()}
🆔 ID: ${telegramId}
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: user.plan === PLANS.PRO ? "🔄 Renew" : "💎 Upgrade", callback_data: "upgrade" },
            { text: "❓ Help", callback_data: "help" },
          ],
        ],
      };

      await bot.sendMessage(msg.chat.id, profileText, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error("Profile command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to retrieve profile");
    }
  };
}

/**
 * Handle /imagine command (image generation - Pro only)
 */
function handleImagineCommand(bot) {
  return async (msg, match) => {
    try {
      const telegramId = msg.from.id.toString();
      const prompt = match[1]?.trim();

      if (!prompt) {
        await bot.sendMessage(
          msg.chat.id,
          "🎨 *Image Generation*\n\nDescribe the image you want to create.\n\nExample: /imagine sunset over beautiful mountains",
          { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
        );
        return;
      }

      // Get user
      const user = await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
      });

      // Check Pro subscription
      if (user.plan !== PLANS.PRO) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 *Pro Feature*\n\nImage generation is available for Pro members only.\n\nUse /upgrade to subscribe!",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const processingMsg = await bot.sendMessage(msg.chat.id, "🎨 Generating image... ⏳");

      try {
        // Call image generation
        const imageUrl = await AIService.generateImage(prompt);
        await bot.deleteMessage(msg.chat.id, processingMsg.message_id);

        await bot.sendPhoto(msg.chat.id, imageUrl, {
          caption: `🎨 *Generated Image*\n\n*Prompt:* ${prompt}`,
          parse_mode: "Markdown",
        });

        logger.info(`Image generated for user ${telegramId}`);
      } catch (imageError) {
        await bot.editMessageText(
          `❌ Image generation failed: ${imageError.message}`,
          { chat_id: msg.chat.id, message_id: processingMsg.message_id }
        );
      }
    } catch (error) {
      logger.error("Imagine command error", error);
      await bot.sendMessage(msg.chat.id, "❌ An error occurred");
    }
  };
}

/**
 * Handle /search command (web search)
 */
function handleSearchCommand(bot) {
  return async (msg, match) => {
    try {
      const telegramId = msg.from.id.toString();
      const query = match[1]?.trim();

      if (!query) {
        await bot.sendMessage(
          msg.chat.id,
          "🔍 *Web Search*\n\nExample: /search latest AI news 2024",
          { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
        );
        return;
      }

      // Track usage
      await SubscriptionService.findOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
      });

      const searchingMsg = await bot.sendMessage(msg.chat.id, "🔍 Searching... ⏳");

      try {
        const results = await AIService.searchWeb(query);

        if (!results || results.length === 0) {
          await bot.editMessageText("❌ No results found", {
            chat_id: msg.chat.id,
            message_id: searchingMsg.message_id,
          });
          return;
        }

        let searchResults = `🔍 *Search Results:* \`${query}\`\n\n`;
        results.slice(0, 5).forEach((result, index) => {
          searchResults +=
            `${index + 1}. [${result.title}](${result.url})\n` +
            `   _${result.snippet}_\n\n`;
        });

        await bot.editMessageText(searchResults, {
          chat_id: msg.chat.id,
          message_id: searchingMsg.message_id,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });

        logger.info(`Web search: "${query}" by ${telegramId}`);
      } catch (searchError) {
        await bot.editMessageText(
          `❌ Search failed: ${searchError.message}`,
          { chat_id: msg.chat.id, message_id: searchingMsg.message_id }
        );
      }
    } catch (error) {
      logger.error("Search command error", error);
      await bot.sendMessage(msg.chat.id, "❌ An error occurred");
    }
  };
}

/**
 * Handle /refer command (referral program)
 */
function handleReferCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();

      // Get referral stats
      const stats = await ReferralService.getReferralStats(telegramId);
      const botUsername = (await bot.getMe()).username;

      const referralText = `
🎁 <b>Referral Program</b>

Share QueClaw with your friends and earn rewards!

🔗 <b>Your Referral Link:</b>
<code>${stats.referralLink}</code>

💰 <b>How It Works:</b>
✅ Send your link to friends
✅ Friend subscribes to Pro
✅ You both get 7 days FREE Pro!

📊 <b>Your Stats:</b>
👥 Friends invited: <b>${stats.invitations}</b>
🎁 Rewards earned: <b>${stats.reward} days</b>
💎 Completed invites: <b>${stats.sentTo}</b>

🏆 <b>Milestones:</b>
⭐ 1st friend → 7 days Free
⭐ 3 friends → 7 more days
⭐ Every 3 → Additional rewards

${
  stats.reward > 0
    ? `\n✨ <b>You have ${stats.reward} days to claim!</b>\nUse /claim to activate your reward.`
    : ""
}
      `;

      await bot.sendMessage(msg.chat.id, referralText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📋 Copy Link", callback_data: "copy_referral" },
              { text: "📊 Share", url: `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}` },
            ],
            ...(stats.reward > 0
              ? [
                  [
                    { text: "🎁 Claim Reward", callback_data: "claim_reward" },
                  ],
                ]
              : []),
          ],
        },
      });

      logger.info(`Refer command used by ${telegramId}`);
    } catch (error) {
      logger.error("Refer command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to load referral program");
    }
  };
}

/**
 * Handle /claim command (claim referral rewards)
 */
function handleClaimCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();

      const result = await ReferralService.claimReferralReward(telegramId);

      if (result.success) {
        await bot.sendMessage(
          msg.chat.id,
          `🎉 <b>${result.message}</b>\n\n` +
            `Your subscription expires on: <b>${result.expireDate?.toLocaleDateString()}</b>\n\n` +
            `You can now use /profile to view your PRO status!`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "👤 View Profile", callback_data: "profile" }],
                [{ text: "🎁 Refer More Friends", callback_data: "referral_stats" }],
              ],
            },
          }
        );
      } else {
        await bot.sendMessage(msg.chat.id, `❌ ${result.message}`, {
          parse_mode: "HTML",
        });
      }

      logger.info(`Claim command used by ${telegramId}`);
    } catch (error) {
      logger.error("Claim command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to claim rewards");
    }
  };
}

/**
 * Handle /pricing command (show all pricing plans and features)
 */
function handlePricingCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();
      const user = await SubscriptionService.findOrCreateUser(telegramId);

      const pricingText = `
<b>💰 QueClaw Pricing Plans</b>

<code>┌─────────────────────────────────────┐
│  PLAN    │  PRICE   │  QUERIES
├─────────────────────────────────────┤
│  FREE    │  $0      │  20/day
│  PRO     │  $4.99   │  500/day  
│  PREMIUM │  $9.99   │  5000/day
└─────────────────────────────────────┘</code>

<b>📊 Detailed Comparison:</b>

🆓 <b>FREE PLAN</b>
   • <b>20 queries/day</b>
   • <b>100 queries/month</b>
   • 5 queries/hour rate limit
   • Basic AI features
   • Good for testing

💎 <b>PRO PLAN</b> - <b>$4.99/month</b>
   • <b>500 queries/day</b>
   • <b>5000 queries/month</b>
   • 100 queries/hour rate limit
   • Priority processing
   • Image generation
   • Web search enabled
   • 🎁 Can earn via referrals

🚀 <b>PREMIUM PLAN</b> - <b>$9.99/month</b>
   • <b>5000 queries/month</b>
   • Unlimited daily processing
   • All feature access
   • Priority support
   • Custom integrations

<b>🎁 Referral Bonuses:</b>
   ✅ Invite 1 friend → 7 days free pro
   ✅ Invite 3 friends → 14 days free pro
   ✅ Unlimited earning potential!

<b>Your Current Plan:</b>
   💎 Plan: <b>${user.plan === "pro" ? "🌟 PRO" : "🆓 FREE"}</b>
   Status: ${user.subscriptionActive ? "✅ ACTIVE" : "❌ INACTIVE"}
   ${
     user.subscriptionActive
       ? `Expires: <b>${user.subscriptionExpire?.toLocaleDateString()}</b>`
       : ""
   }
      `;

      await bot.sendMessage(msg.chat.id, pricingText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💎 Get PRO", callback_data: "upgrade_pro" },
              { text: "👤 My Plan", callback_data: "profile" },
            ],
            [
              { text: "🎁 Refer & Earn", callback_data: "referral_stats" },
              { text: "❓ Help", callback_data: "help" },
            ],
          ],
        },
      });

      logger.info(`Pricing command used by ${telegramId}`);
    } catch (error) {
      logger.error("Pricing command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to load pricing");
    }
  };
}

/**
 * Handle /verify command (check subscription status after payment)
 */
function handleVerifyCommand(bot) {
  return async (msg) => {
    try {
      const telegramId = msg.from.id.toString();

      // Verify subscription status
      const user = await SubscriptionService.findOrCreateUser(telegramId);

      const subscriptionStatus = user.subscriptionActive
        ? `✅ Active (expires ${user.subscriptionExpire?.toLocaleDateString() || "N/A"})`
        : "❌ Inactive";

      const verifyText = `
<b>✅ Subscription Status Verified</b>

<b>Your Account:</b>
💎 Plan: ${user.plan === PLANS.PRO ? "🌟 PRO" : "🆓 FREE"}
Status: ${subscriptionStatus}
📊 AI Usage: ${user.aiUsage}

${
  user.subscriptionActive
    ? "<b>✨ Your subscription is active!</b>\nYou can now use all PRO features.\n\nUse /ai &lt;prompt&gt; to ask questions!"
    : '<b>⏳ Waiting for activation...</b>\n\nIf you recently completed payment, it may take 1-2 minutes to activate.\n\nUse /upgrade to subscribe or contact support.'
}
      `;

      await bot.sendMessage(msg.chat.id, verifyText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 View Profile", callback_data: "profile" }],
            [
              { text: user.subscriptionActive ? "🔄 Renew" : "💎 Upgrade", callback_data: "upgrade" },
              { text: "❓ Help", callback_data: "help" },
            ],
          ],
        },
      });

      logger.info(`Verify command used by ${telegramId}`);
    } catch (error) {
      logger.error("Verify command error", error);
      await bot.sendMessage(msg.chat.id, "❌ Failed to verify subscription");
    }
  };
}

export default registerBotHandlers;
