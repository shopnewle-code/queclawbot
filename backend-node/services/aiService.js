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
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Send prompt to AI engine and get response
   */
  async askAI(prompt, userId) {
    try {
      const response = await axios.post(
        `${this.aiServerUrl}/ask`,
        {
          text: prompt,
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

      if (error.code === "ECONNREFUSED") {
        throw new Error("AI server is not running");
      }

      if (error.response?.status === 429) {
        throw new Error("AI server rate limit exceeded");
      }

      throw error;
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
