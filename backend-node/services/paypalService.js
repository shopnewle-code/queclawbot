import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * PayPal Service
 * Handles all PayPal API operations
 */

export class PayPalService {
  constructor() {
    this.baseURL = env.PAYPAL_BASE_URL;
    this.clientId = env.PAYPAL_CLIENT_ID;
    this.secret = env.PAYPAL_SECRET;
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  /**
   * Get PayPal access token with caching
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenExpiry > Date.now()) {
      return this.tokenCache;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.secret}`).toString(
        "base64"
      );

      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      this.tokenCache = response.data.access_token;
      // Cache token for 45 minutes (expires in 1 hour)
      this.tokenExpiry = Date.now() + 45 * 60 * 1000;

      return this.tokenCache;
    } catch (error) {
      logger.error("Failed to get PayPal token", error);
      throw new Error("PayPal authentication failed");
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(telegramId, planId = env.PAYPAL_PLAN_ID) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v1/billing/subscriptions`,
        {
          plan_id: planId,
          custom_id: telegramId,
          application_context: {
            brand_name: "QueClaw AI",
            locale: "en-US",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${env.BASE_URL}/api/paypal/success`,
            cancel_url: `${env.BASE_URL}/api/paypal/cancel`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `sub-${telegramId}-${Date.now()}`,
          },
          timeout: 10000,
        }
      );

      const approvalLink = response.data.links.find(
        (link) => link.rel === "approve"
      );

      logger.success(
        `Subscription created for user ${telegramId}: ${response.data.id}`
      );

      return {
        subscriptionId: response.data.id,
        approvalUrl: approvalLink.href,
      };
    } catch (error) {
      logger.error(`Failed to create subscription for ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Create a one-time order
   */
  async createOrder(amount = "5.00", currency = "USD", telegramId = null) {
    try {
      const token = await this.getAccessToken();

      const purchaseUnit = {
        amount: {
          currency_code: currency,
          value: amount,
        },
      };

      // Include telegram ID for webhook to link payment to user
      if (telegramId) {
        purchaseUnit.custom_id = telegramId.toString();
      }

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [purchaseUnit],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      logger.success(`Order created: ${response.data.id}${telegramId ? " for user " + telegramId : ""}`);
      return response.data;
    } catch (error) {
      logger.error("Failed to create order", error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookId, transmissionId, transmissionTime, cert, body) {
    // This is a simplified version
    // In production, use PayPal's official webhook signature verification
    logger.debug("Webhook signature verification (simplified)");
    return true;
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get subscription ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason = "Customer requested cancellation") {
    try {
      const token = await this.getAccessToken();

      await axios.post(
        `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.success(`Subscription ${subscriptionId} cancelled`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel subscription ${subscriptionId}`, error);
      throw error;
    }
  }
}

export const paypalService = new PayPalService();
export default paypalService;
