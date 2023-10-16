// authRoutes.ts
import express from "express";
import { check } from "express-validator";
import {
  authCheck,
  login,
  logout,
  regUser,
} from "../controllers/authControllers"; // Import controller functions

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
  regUser
);

//authCheck route
router.post("/auth-check", authCheck);

// Login route
router.post("/login", login);

// Logout route

router.get("/logout", logout);

export default router;
