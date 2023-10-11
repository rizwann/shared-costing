// authRoutes.ts
import express from "express";
import { check } from "express-validator";
import { login, logout, regUser } from "../controllers/authControllers"; // Import controller functions

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

// Login route
router.post("/login", login);

// Logout route

router.get("/logout", logout);

// Logout route
// router.get("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).json({ message: "Server error" });
//     }
//     res.clearCookie("sid");
//     res.status(200).json({ message: "User logged out" });
//   });
// });

export default router;
