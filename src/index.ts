import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import houseRoutes from "./routes/houseRoutes";
import storeRoutes from "./routes/storeRoutes";

const app = express();

// Load environment variables from .env file
require("dotenv").config();

// Middleware
app.use(bodyParser.json()); // Parse JSON requests
app.use(cors());
const port = 3000;
const mongoURI = process.env.MONGODB_URI as string;

// MongoDB Connection
mongoose.connect(mongoURI);

const db = mongoose.connection;

// Use the authentication and house routes
app.use("/api/auth", authRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/expenses", expenseRoutes);

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
  // Start your Express server here
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
