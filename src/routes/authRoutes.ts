// authRoutes.ts
import express from "express";
import { check } from "express-validator";
import { loginUser, registerUser } from "../controllers/authControllers"; // Import controller functions

const router = express.Router();

// Registration route
router.post(
  "/register",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
  ],
  registerUser
);

// Login route
router.post("/login", loginUser);

export default router;
