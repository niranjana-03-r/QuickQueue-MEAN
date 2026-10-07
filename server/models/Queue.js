const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  serviceCentre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceCentre",
    required: true
  },

  tokenNumber: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      "Waiting",
      "Serving",
      "Completed",
      "Skipped",
      "Cancelled"
    ],
    default: "Waiting"
  },

  joinedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date
  }
});

module.exports = mongoose.model("Queue", queueSchema);