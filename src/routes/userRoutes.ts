import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserPassword,
  updateUsernameEmail,
  getUsersByHouseCode
} from "../controllers/userController";
import {
  authMiddleware,
  isAdmin,
  isHouser,
  isOwner,
} from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + req.body.username); // Define the file name
  },
});

const upload = multer({ storage });
router.use(authMiddleware);

router.get("/all", isAdmin, getAllUsers);
router.get("/:userId", isOwner, getUserById);
router.get("/house/:code", isHouser, getUsersByHouseCode);
router.put("/:userId", isOwner,upload.single("image"), updateUsernameEmail);
router.put("/:userId/change-password", isOwner, updateUserPassword);

export default router;
