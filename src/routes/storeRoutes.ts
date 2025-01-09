import { Router } from "express";
import multer from "multer";

import {
  createStore,
  deleteStore,
  getStoreById,
  getStoreNames,
  getStores,
  updateStore,
} from "../controllers/storeControllers";
import { authMiddleware } from "../middlewares/authMiddleware";

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
      folder: "store",
      format: "jpg", // Automatically convert to jpg
      public_id: Date.now() + "-" + req.body.name,
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

// Create a new store with image upload
router.post("/create", upload.single("image"), authMiddleware, createStore);

// Get all store
router.get("/", getStores);

// Get all store names
router.get("/names", getStoreNames)
// Get a store by ID
router.get("/:id", getStoreById);

// Update a store by ID
router.put("/:id", upload.single("image"), authMiddleware, updateStore);

// Delete a store by ID
router.delete("/:id", deleteStore);

export default router;
