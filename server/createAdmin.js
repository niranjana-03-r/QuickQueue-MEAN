const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@quickqueue.com";
    const password = "admin123";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      await existingAdmin.save();

      console.log("Admin account updated successfully");
      console.log("Email:", email);
      console.log("Password:", password);

      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "QuickQueue Admin",
      email,
      phone: "9876543210",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin account created successfully");
    console.log("Email:", email);
    console.log("Password:", password);

    await mongoose.disconnect();

  } catch (error) {
    console.error("Admin creation failed:", error.message);
  }
}

createAdmin();