const mongoose = require("mongoose");

const shortUrlSchema = new mongoose.Schema({
  longUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
  customAlias: {
    type: String,
    unique: true, 
    sparse: true, 
  },
  topic: {
    type: String,
    enum: ["acquisition", "activation", "retention", "other"],
    default: "other",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("ShortUrl", shortUrlSchema);
