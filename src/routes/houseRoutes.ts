import express from "express";
import multer from "multer";
import {
  createHouse,
  deleteHouse,
  getAllHouses,
  getHousesByUserId,
  getSingleHouse,
  getUserByHouseCode,
  joinHouse,
  leaveHouse,
  updateHouse,
} from "../controllers/houseControllers";
import {
  authMiddleware,
  isAdmin,
  isHouseMember,
  isHouser,
} from "../middlewares/authMiddleware";

const router = express.Router();

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + req.body.description); // Define the file name
  },
});

const upload = multer({ storage });

router.use(authMiddleware);

// Create a new house with image upload
router.post(
  "/create",

  upload.single("image"),
  authMiddleware,
  createHouse
);
// Get all houses
router.get("/all", isAdmin, getAllHouses);
// Get a house by ID
router.get("/", getHousesByUserId);

// Get all users of a house

router.get("/users/:code", isHouser, getUserByHouseCode);

router.get("/:code", getSingleHouse);

// Update a house by ID
router.put(
  "/:id",

  isHouseMember,
  upload.single("image"),
  updateHouse
);

// Delete a house by ID
router.delete("/:id", isHouseMember, deleteHouse);

// join a house
router.post("/join-house", joinHouse);

// Leave a house
router.post("/leave-house", leaveHouse);

export default router;
