import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";

const app = express();

// Load environment variables from .env file
require("dotenv").config();

app.use(bodyParser.json()); // Parse JSON requests
app.use(cors()); // Enable CORS if necessary
const port = 3000;
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI as string;

mongoose.connect(mongoURI);

const db = mongoose.connection;

app.use("/auth", authRoutes);

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
