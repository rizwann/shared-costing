// authRoutes.ts
import express from "express"
import { check } from "express-validator"
import { activateUser, login, regUser } from "../controllers/authControllers" // Import controller functions
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v2 as cloudinary } from "cloudinary"

const router = express.Router()

// Configure Cloudinary Storage with Transformations
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "user",
      format: "jpg", // Automatically convert to jpg
      public_id: Date.now() + "-" + req.body.username,
      transformation: [
        { width: 800, height: 600, crop: "limit" }, // Resize with a limit
        { quality: "auto" }, // Automatic quality adjustment
        { fetch_format: "auto" }, // Automatic format selection (e.g., WebP)
      ],
    }
  },
})

const upload = multer({ storage })
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
)

//authCheck route
// router.post("/auth-check", authCheck);

// Login route
router.post("/login", login)

// Logout route

// router.get("/logout", logout);

//actuvate account route
router.get("/activate/:id/:token", activateUser)

export default router
