import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary'
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// var corsOptions = {
//   // multiple domains
//   origin: ["http://localhost:5173", "http://192.168.2.103:5173", "https://expense-man.netlify.app", "capacitor://localhost","http://localhost"],
//   credentials: true,
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// };
const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = ["http://localhost:5173", "http://192.168.2.103:5173", "https://expense-man.netlify.app", "capacitor://localhost","http://localhost", "null", "undefined"]; // Add "null" for mobile apps
    console.log("origin", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
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
