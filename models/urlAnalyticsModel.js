const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  alias: {
    type: String,
    required: true,
  },
  totalClicks: {
    type: Number,
    default: 0,
  },
  uniqueUsers: {
    type: Number,
    default: 0,
  },
  clicksByDate: [
    {
      date: {
        type: Date,
      },
      clickCount: {
        type: Number,
      },
    },
  ],
  osType: [
    {
      osName: {
        type: String,
      },
      uniqueClicks: {
        type: Number,
      },
      uniqueUsers: {
        type: Number,
      },
    },
  ],
  deviceType: [
    {
      deviceName: {
        type: String,
      },
      uniqueClicks: {
        type: Number,
      },
      uniqueUsers: {
        type: Number,
      },
    },
  ],
  userAgent: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Analytics", analyticsSchema);
