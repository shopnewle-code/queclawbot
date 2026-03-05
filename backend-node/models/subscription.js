import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },

  paypalSubscriptionId: String,

  status: {
    type: String,
    default: "inactive"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Subscription", subscriptionSchema);