require("dns").setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const serviceCentreRoutes = require("./routes/serviceCentreRoutes");
const queueRoutes = require("./routes/queueRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/service-centres", serviceCentreRoutes);
app.use("/api/queues", queueRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "QuickQueue Backend is running successfully"
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });