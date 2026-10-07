const mongoose = require("mongoose");

const serviceCentreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      "Hospital",
      "Bank",
      "Post Office",
      "Pharmacy",
      "Government Office",
      "Other"
    ],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  },
  phone: {
    type: String
  },
  openingTime: {
    type: String,
    required: true
  },
  closingTime: {
    type: String,
    required: true
  },
  avgServiceTime: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ["Open", "Closed"],
    default: "Open"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ServiceCentre", serviceCentreSchema);