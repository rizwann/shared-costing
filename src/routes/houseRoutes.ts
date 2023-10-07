import express from "express";
import multer from "multer";
import {
  createHouse,
  deleteHouse,
  getHouseById,
  getHouses,
  updateHouse,
} from "../controllers/houseController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = express.Router();

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + req.body.description); // Define the file name
  },
});

const upload = multer({ storage });
router.use(isAuthenticated);

// Create a new house with image upload
router.post("/create", upload.single("image"), createHouse);

// Get all houses
router.get("/all", getHouses);

// Get a house by ID
router.get("/:id", getHouseById);

// Update a house by ID
router.put("/:id", upload.single("image"), updateHouse);

// Delete a house by ID
router.delete("/:id", deleteHouse);

export default router;
