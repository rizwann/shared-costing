import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserPassword,
  updateUsernameEmail,
} from "../controllers/userController";
import {
  authMiddleware,
  isAdmin,
  isOwner,
} from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/all", isAdmin, getAllUsers);
router.get("/:userId", isOwner, getUserById);
router.put("/:userId", isOwner, updateUsernameEmail);
router.put("/:userId/change-password", isOwner, updateUserPassword);

export default router;
