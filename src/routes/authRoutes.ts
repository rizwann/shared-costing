// authRoutes.ts
import express from "express";
import { check } from "express-validator";
import { activateUser, login, regUser } from "../controllers/authControllers"; // Import controller functions
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, _file, cb) => {
    cb(null, Date.now() + "-" + req.body.username); // Define the file name
  },
});

const upload = multer({ storage });
// Registration route
router.post(
  "/register",
  upload.single("image"),
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
// router.post("/auth-check", authCheck);

// Login route
router.post("/login", login);

// Logout route

// router.get("/logout", logout);

//actuvate account route
router.get("/activate/:id/:token", activateUser);

export default router;
