import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserPassword,
  updateUsernameEmail,
  getUsersByHouseCode,
  deleteUser
} from "../controllers/userController";
import {
  authMiddleware,
  isAdmin,
  isHouser,
  isOwner,
} from "../middlewares/authMiddleware";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v2 as cloudinary } from "cloudinary"

const router = Router()

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
      folder: "users",
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
const upload = multer({ storage });
router.use(authMiddleware);

router.get("/all", isAdmin, getAllUsers);
router.get("/:userId", isOwner, getUserById);
router.get("/house/:code", isHouser, getUsersByHouseCode);
router.put("/:userId", isOwner,upload.single("image"), updateUsernameEmail);
router.put("/:userId/change-password", isOwner, updateUserPassword);
router.delete("/:userId", isAdmin, deleteUser);

export default router;
