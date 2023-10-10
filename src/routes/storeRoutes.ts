import express from "express";
import multer from "multer";

import {
  createStore,
  deleteStore,
  getStoreById,
  getStores,
} from "../controllers/storeControllers";

const router = express.Router();

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, _file, cb) => {
    cb(null, Date.now() + "-" + req.body.name); // Define the file name
  },
});

const upload = multer({ storage });

//router.use(isAuthenticated);

// Create a new store with image upload
router.post("/create", upload.single("image"), createStore);

// Get all hstore
router.get("/", getStores);

// Get a store by ID
router.get("/:id", getStoreById);

// Update a store by ID
router.put("/:id", upload.single("image"), getStoreById);

// Delete a store by ID
router.delete("/:id", deleteStore);

export default router;
