import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import houseRoutes from "./routes/houseRoutes";
import storeRoutes from "./routes/storeRoutes";

const app = express();

// Load environment variables from .env file
require("dotenv").config();

// Middleware
app.use(bodyParser.json()); // Parse JSON requests
app.use(cors()); // Enable CORS if necessary
const port = 3000;
const mongoURI = process.env.MONGODB_URI as string;

const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
  uri: mongoURI,
  collection: "sessions",
});
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// MongoDB Connection
mongoose.connect(mongoURI);

const db = mongoose.connection;

// Use the authentication and house routes
app.use("/auth", authRoutes);
app.use("/houses", houseRoutes); // Use the house routes
app.use("/stores", storeRoutes); // Use the store routes

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
