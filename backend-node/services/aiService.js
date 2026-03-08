import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * AI Engine Service
 * Communicates with the Python FastAPI AI engine
 */

export class AIService {
  constructor() {
    this.aiServerUrl = env.AI_SERVER_URL;
    this.openaiApiKey = env.OPENAI_API_KEY;
    this.openaiBaseUrl = env.OPENAI_BASE_URL;
    this.openaiModel = env.OPENAI_MODEL;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Send prompt to AI engine and get response
   */
  async askAI(prompt, userId) {
    const trimmedPrompt = `${prompt || ""}`.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt cannot be empty");
    }

    if (this.aiServerUrl) {
      try {
        const response = await axios.post(
          `${this.aiServerUrl}/ask`,
          {
            text: trimmedPrompt,
            user_id: userId,
          },
          {
            timeout: this.timeout,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        logger.debug(`AI response for user ${userId}`);
        return response.data;
      } catch (error) {
        logger.error(`AI request failed for user ${userId}`, error.message);

        if (error.response?.status === 429) {
          throw new Error("AI server rate limit exceeded");
        }

        if (this.shouldFallbackToOpenAI(error) && this.openaiApiKey) {
          logger.warn(
            "AI server unavailable. Falling back to direct OpenAI API."
          );
          return this.askOpenAIDirect(trimmedPrompt, userId);
        }

        if (error.code === "ECONNREFUSED") {
          throw new Error("AI server is not running");
        }

        throw error;
      }
    }

    if (this.openaiApiKey) {
      return this.askOpenAIDirect(trimmedPrompt, userId);
    }

    throw new Error(
      "AI is not configured. Set AI_SERVER_URL or OPENAI_API_KEY."
    );
  }

  shouldFallbackToOpenAI(error) {
    if (!error) return true;

    const networkErrors = new Set([
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNRESET",
      "EAI_AGAIN",
    ]);

    if (networkErrors.has(error.code)) {
      return true;
    }

    const status = error.response?.status;
    return status >= 500;
  }

  async askOpenAIDirect(prompt, userId) {
    if (!this.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.openaiModel,
          messages: [{ role: "user", content: prompt }],
        },
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        throw new Error("Empty response from OpenAI");
      }

      logger.debug(`OpenAI response for user ${userId}`);
      return {
        reply,
        provider: "openai",
        model: this.openaiModel,
      };
    } catch (error) {
      logger.error(`OpenAI request failed for user ${userId}`, error.message);

      if (error.response?.status === 401) {
        throw new Error("Invalid OPENAI_API_KEY");
      }

      if (error.response?.status === 429) {
        throw new Error("OpenAI rate limit exceeded");
      }

      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  /**
   * Get user information from AI engine
   */
  async getUserInfo(userId) {
    try {
      const response = await axios.get(
        `${this.aiServerUrl}/get_user/${userId}`,
        {
          timeout: this.timeout,
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get user info from AI engine`, error.message);
      throw error;
    }
  }

  /**
   * Update user plan in AI engine
   */
  async updateUserPlan(userId, plan) {
    try {
      const response = await axios.post(
        `${this.aiServerUrl}/update-plan`,
        {
          user_id: userId,
          plan: plan,
        },
        {
          timeout: this.timeout,
        }
      );

      logger.success(`Updated plan for user ${userId}: ${plan}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update user plan in AI engine`, error.message);
      // Don't throw, log and continue
      return null;
    }
  }

  /**
   * Health check for AI server
   */
  async healthCheck() {
    if (!this.aiServerUrl) {
      return Boolean(this.openaiApiKey);
    }

    try {
      const response = await axios.get(`${this.aiServerUrl}/health`, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      logger.warn("AI server health check failed");
      return false;
    }
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(prompt) {
    try {
      const response = await axios.post(
        `${this.aiServerUrl}/generate-image`,
        {
          prompt: prompt,
        },
        {
          timeout: 60000, // 60 seconds for image generation
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      logger.debug("Image generated successfully");
      return response.data.image_url || response.data.url;
    } catch (error) {
      logger.error("Image generation failed", error.message);

      if (error.response?.status === 402) {
        throw new Error("Insufficient credits for image generation");
      }

      if (error.code === "ECONNREFUSED") {
        throw new Error("AI server is offline");
      }

      throw new Error(error.response?.data?.message || "Image generation failed");
    }
  }

  /**
   * Search the web for information
   */
  async searchWeb(query) {
    try {
      const response = await axios.post(
        `${this.aiServerUrl}/search`,
        {
          q: query,
        },
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      logger.debug(`Web search for "${query}" completed`);
      return response.data.results || response.data;
    } catch (error) {
      logger.error("Web search failed", error.message);

      if (error.response?.status === 429) {
        throw new Error("Search rate limit exceeded");
      }

      throw new Error(error.response?.data?.message || "Web search failed");
    }
  }
}

export const aiService = new AIService();
export default aiService;
