import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export class AIService {
  constructor() {
    this.aiServerUrl = env.AI_SERVER_URL;
    this.openaiApiKey = env.OPENAI_API_KEY;
    this.groqApiKey = env.GROQ_API_KEY;
    this.claudeApiKey = env.CLAUDE_API_KEY;
    this.geminiApiKey = env.GEMINI_API_KEY;
    this.hfApiKey = env.HUGGINGFACE_API_KEY;
    this.openaiBaseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.openaiModel = env.OPENAI_MODEL || "gpt-4o-mini";
    this.defaultProvider = (env.AI_PROVIDER || "auto").toLowerCase();
    this.groqModels = (env.GROQ_MODELS || "llama-3.3-70b-versatile,llama-3.1-8b-instant,llama3-70b-8192")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    this.timeout = 30000;
  }

  normalizeProvider(provider) {
    const value = `${provider || "auto"}`.trim().toLowerCase();
    if (value === "grok") return "groq";
    return value;
  }

  async askWithOpenAIThenGroq(text) {
    if (!this.openaiApiKey && !this.groqApiKey) {
      throw new Error("No OpenAI/Groq provider configured");
    }

    if (this.openaiApiKey) {
      try {
        return await this.askOpenAI(text);
      } catch (error) {
        logger.warn(`OpenAI failed. ${this.groqApiKey ? "Trying Groq." : "No Groq fallback."}`);
        if (!this.groqApiKey) throw error;
      }
    }
    return await this.askGroq(text);
  }

  async askAI(prompt, userId, plan = "free", preferredProvider = "auto") {
    const text = `${prompt || ""}`.trim();
    if (!text) throw new Error("Prompt cannot be empty");

    try {
      if (this.aiServerUrl) {
        try {
          const response = await axios.post(
            `${this.aiServerUrl}/ask`,
            { text, user_id: userId },
            { timeout: this.timeout }
          );
          return response.data;
        } catch {
          logger.warn("AI server unavailable. Switching to cloud AI.");
        }
      }

      const selectedProvider = this.normalizeProvider(
        preferredProvider === "auto" ? this.defaultProvider : preferredProvider
      );

      if (selectedProvider === "openai") {
        try {
          return await this.askWithOpenAIThenGroq(text);
        } catch (primaryError) {
          logger.warn(`OpenAI/Groq chain failed: ${primaryError.message}`);
          if (this.geminiApiKey) return await this.askGemini(text);
          if (this.hfApiKey) return await this.askHuggingFace(text);
          throw primaryError;
        }
      }

      if (selectedProvider === "groq") {
        if (!this.groqApiKey) {
          throw new Error("Groq provider is not configured");
        }
        return await this.askGroq(text);
      }

      const normalizedPlan = `${plan || "free"}`.toLowerCase();
      const isPremiumTier =
        normalizedPlan === "premium" || normalizedPlan === "enterprise";

      if (isPremiumTier && this.claudeApiKey) {
        return await this.askClaude(text);
      }

      if (normalizedPlan === "pro" || isPremiumTier) {
        try {
          return await this.askWithOpenAIThenGroq(text);
        } catch (primaryError) {
          logger.warn(`Primary provider chain failed: ${primaryError.message}`);
          if (this.geminiApiKey) return await this.askGemini(text);
          if (this.hfApiKey) return await this.askHuggingFace(text);
          throw primaryError;
        }
      }

      if (this.groqApiKey) {
        return await this.askGroq(text);
      }

      if (this.openaiApiKey) {
        return await this.askWithOpenAIThenGroq(text);
      }

      if (this.geminiApiKey) {
        return await this.askGemini(text);
      }

      if (this.hfApiKey) {
        return await this.askHuggingFace(text);
      }

      throw new Error("No AI provider configured");
    } catch (error) {
      logger.error("AI request failed", error.message);
      throw error;
    }
  }

  async askOpenAI(prompt) {
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
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        reply: response.data.choices[0].message.content.trim(),
        provider: "openai",
        model: this.openaiModel,
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error("AI is busy. Please try again in a few seconds.");
      }
      if (error.response?.status === 401) {
        throw new Error("Invalid OpenAI API key.");
      }
      throw new Error(error.response?.data?.error?.message || "AI error occurred.");
    }
  }

  async askGroq(prompt) {
    let lastError;
    for (const model of this.groqModels) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model,
            messages: [{ role: "user", content: prompt }],
          },
          {
            timeout: this.timeout,
            headers: {
              Authorization: `Bearer ${this.groqApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        return {
          reply: response.data.choices[0].message.content,
          provider: "groq",
          model,
        };
      } catch (error) {
        lastError = error;
        const details =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        logger.warn(`Groq model ${model} failed: ${details}`);
      }
    }

    throw new Error(
      lastError?.response?.data?.error?.message ||
        lastError?.response?.data?.message ||
        "Groq request failed."
    );
  }

  async askClaude(prompt) {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      },
      {
        timeout: this.timeout,
        headers: {
          "x-api-key": this.claudeApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    return {
      reply: response.data.content[0].text,
      provider: "claude",
      model: "claude-3-haiku",
    };
  }

  async askGemini(prompt) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        timeout: this.timeout,
      }
    );

    return {
      reply: response.data.candidates[0].content.parts[0].text,
      provider: "gemini",
      model: "gemini-pro",
    };
  }

  async askHuggingFace(prompt) {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      { inputs: prompt },
      {
        timeout: this.timeout,
        headers: {
          Authorization: `Bearer ${this.hfApiKey}`,
        },
      }
    );

    return {
      reply: response.data[0].generated_text,
      provider: "huggingface",
      model: "mistral-7b",
    };
  }

  async generateImage(prompt) {
    if (!prompt?.trim()) {
      throw new Error("Prompt cannot be empty");
    }

    if (this.aiServerUrl) {
      try {
        const response = await axios.post(
          `${this.aiServerUrl}/generate-image`,
          { prompt: prompt.trim() },
          { timeout: 60000 }
        );
        return response.data?.image_url || response.data?.url;
      } catch {
        logger.warn("Image generation via AI server failed.");
      }
    }

    if (!this.openaiApiKey) {
      throw new Error("Image generation unavailable. Configure OPENAI_API_KEY.");
    }

    const response = await axios.post(
      `${this.openaiBaseUrl}/images/generations`,
      {
        model: "gpt-image-1",
        prompt: prompt.trim(),
        size: "1024x1024",
      },
      {
        timeout: 60000,
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const imageUrl = response.data?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Image generation failed");
    }
    return imageUrl;
  }

  async searchWeb(query) {
    if (!query?.trim()) {
      throw new Error("Search query cannot be empty");
    }

    if (this.aiServerUrl) {
      try {
        const response = await axios.post(
          `${this.aiServerUrl}/search`,
          { q: query.trim() },
          { timeout: this.timeout }
        );
        return response.data?.results || response.data;
      } catch {
        logger.warn("Web search via AI server failed.");
      }
    }

    throw new Error("Web search unavailable. Configure AI server /search endpoint.");
  }

  async healthCheck() {
    try {
      if (this.aiServerUrl) {
        const res = await axios.get(`${this.aiServerUrl}/health`);
        if (res.status === 200) return true;
      }

      return Boolean(
        this.openaiApiKey ||
          this.groqApiKey ||
          this.claudeApiKey ||
          this.geminiApiKey ||
          this.hfApiKey
      );
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();
export default aiService;
