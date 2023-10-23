import { Router } from "express";
import multer from "multer";

import {
  createStore,
  deleteStore,
  getStoreById,
  getStores,
  updateStore,
} from "../controllers/storeControllers";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
// destination: (req, file, cb) => {
//   cb(null, "images");
// },
// filename: (req, file, cb) => {
//   cb(null, req.body.name );
//   console.log(req.body.name)
// },
// });
// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, _file, cb) => {
    cb(null, Date.now() + "-" + req.body.name); // Define the file name
  },
});

const upload = multer({ storage });

router.use(authMiddleware);

// Create a new store with image upload
router.post("/create", upload.single("image"), authMiddleware, createStore);

// Get all hstore
router.get("/", getStores);

// Get a store by ID
router.get("/:id", getStoreById);

// Update a store by ID
router.put("/:id", upload.single("image"), authMiddleware, updateStore);

// Delete a store by ID
router.delete("/:id", deleteStore);

export default router;
