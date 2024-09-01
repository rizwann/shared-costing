import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import chartRoutes from "./routes/chartRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import forgerPWRoutes from "./routes/forgetPassword";
import houseRoutes from "./routes/houseRoutes";
import storeRoutes from "./routes/storeRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

// Load environment variables from .env file
require("dotenv").config();

var corsOptions = {
  // multiple domains
  origin: ["http://localhost:5173", "http://192.168.2.103:5173"],
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cookieParser());

app.use(cors(corsOptions));
app.use("/uploads", express.static("uploads"));
app.use(compression());
app.use(bodyParser.json()); // Parse JSON requests
const port = 3000;
const mongoURI = process.env.MONGODB_URI as string;

// MongoDB Connection
mongoose.connect(mongoURI);

const db = mongoose.connection;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

// Use the authentication and house routes
app.use("/api/auth", authRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chart", chartRoutes);
app.use("/", forgerPWRoutes);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//test get request

db.on("error", (err: Error) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
