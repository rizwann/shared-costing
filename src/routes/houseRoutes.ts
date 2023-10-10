import express from "express";
import { check } from "express-validator";
import multer from "multer";
import {
  createHouse,
  deleteHouse,
  getHousesByUserId,
  joinHouse,
  updateHouse,
} from "../controllers/houseControllers";

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
//router.use(isAuthenticated);

// Create a new house with image upload
router.post(
  "/create",
  [
    check("code", "Code must be at least 6 characters long").isLength({
      min: 6,
    }),
  ],
  upload.single("image"),
  createHouse
);

// Get a house by ID
router.get("/:id", getHousesByUserId);

// Update a house by ID
router.put("/:id", upload.single("image"), updateHouse);

// Delete a house by ID
router.delete("/:id", deleteHouse);

// join a house
router.post("/join-house", joinHouse);

export default router;
