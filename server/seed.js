require("dns").setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
require("dotenv").config();

const ServiceCentre = require("./models/ServiceCentre");

const serviceCentres = [
  {
    name: "Government General Hospital",
    category: "Hospital",
    address: "Government Hospital Road, Madurai",
    lat: 9.9252,
    lon: 78.1198,
    phone: "0452-2533322",
    openingTime: "08:00",
    closingTime: "20:00",
    avgServiceTime: 10,
    status: "Open"
  },
  {
    name: "City Care Hospital",
    category: "Hospital",
    address: "KK Nagar, Madurai",
    lat: 9.9380,
    lon: 78.1290,
    phone: "0452-2456789",
    openingTime: "00:00",
    closingTime: "23:59",
    avgServiceTime: 8,
    status: "Open"
  },
  {
    name: "State Bank of India",
    category: "Bank",
    address: "Anna Nagar, Madurai",
    lat: 9.9195,
    lon: 78.1400,
    phone: "1800-11-2211",
    openingTime: "10:00",
    closingTime: "16:00",
    avgServiceTime: 5,
    status: "Open"
  },
  {
    name: "Indian Bank",
    category: "Bank",
    address: "Tallakulam, Madurai",
    lat: 9.9350,
    lon: 78.1405,
    phone: "0452-2534567",
    openingTime: "10:00",
    closingTime: "16:00",
    avgServiceTime: 6,
    status: "Open"
  },
  {
    name: "Madurai Head Post Office",
    category: "Post Office",
    address: "East Veli Street, Madurai",
    lat: 9.9177,
    lon: 78.1190,
    phone: "0452-2625555",
    openingTime: "09:00",
    closingTime: "17:00",
    avgServiceTime: 5,
    status: "Open"
  },
  {
    name: "Apollo Pharmacy",
    category: "Pharmacy",
    address: "KK Nagar Main Road, Madurai",
    lat: 9.9345,
    lon: 78.1275,
    phone: "0452-2345678",
    openingTime: "08:00",
    closingTime: "22:00",
    avgServiceTime: 3,
    status: "Open"
  },
  {
    name: "Madurai Corporation Office",
    category: "Government Office",
    address: "Anna Maligai, Madurai",
    lat: 9.9190,
    lon: 78.1195,
    phone: "0452-2540333",
    openingTime: "10:00",
    closingTime: "17:00",
    avgServiceTime: 8,
    status: "Open"
  },
  {
    name: "Regional Transport Office",
    category: "Government Office",
    address: "Melur Road, Madurai",
    lat: 9.9500,
    lon: 78.1500,
    phone: "0452-2531111",
    openingTime: "10:00",
    closingTime: "17:00",
    avgServiceTime: 10,
    status: "Open"
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    await ServiceCentre.deleteMany();

    await ServiceCentre.insertMany(serviceCentres);

    console.log("Service centres added successfully");
    console.log(`Total centres added: ${serviceCentres.length}`);

    await mongoose.connection.close();

    console.log("Database connection closed");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();