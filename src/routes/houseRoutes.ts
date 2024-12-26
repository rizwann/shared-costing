import express from "express"
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v2 as cloudinary } from "cloudinary"
import {
  acceptUser,
  createHouse,
  deleteHouse,
  getAllHouses,
  getHouseById,
  getHousesByUserId,
  getSingleHouse,
  getUserByHouseCode,
  joinHouse,
  leaveHouse,
  updateHouse,
} from "../controllers/houseControllers"
import {
  authMiddleware,
  isAdmin,
  isHouseMember,
  isHouser,
} from "../middlewares/authMiddleware"

const router = express.Router()

// Configure Cloudinary Storage with Transformations
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Correct Cloudinary Storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "houses",
      format: "jpg", // Automatically convert to jpg
      public_id: Date.now() + "-" + req.body.description,
      transformation: [
        { width: 800, height: 600, crop: "limit" }, // Resize with a limit
        { quality: "auto" }, // Automatic quality adjustment
        { fetch_format: "auto" }, // Automatic format selection (e.g., WebP)
      ],
    }
  },
})

const upload = multer({ storage })

router.use(authMiddleware)

// Create a new house with image upload
router.post("/create", upload.single("image"), authMiddleware, createHouse)
// Get all houses
router.get("/all", isAdmin, getAllHouses)
// Get a house by ID
router.get("/", getHousesByUserId)

// Get all users of a house

router.get("/users/:code", isHouser, getUserByHouseCode)

router.get("/:code", isHouser, getSingleHouse)

router.get("/house/:id", isHouseMember, getHouseById)

// Update a house by ID
router.put(
  "/:id",

  isHouseMember,
  upload.single("image"),
  updateHouse
)

// Delete a house by ID
router.delete("/:id", isHouseMember, deleteHouse)

// join a house
router.post("/join-house", upload.none(), authMiddleware, joinHouse)

// accept an user to a house
 router.post("/accept-user/:id/:houseCode/:ownId", acceptUser)

// Leave a house
router.post("/leave-house", leaveHouse)

export default router
