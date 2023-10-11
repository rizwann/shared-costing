import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserById,
} from "../controllers/userController";
import {
  isAdmin,
  isAuthenticated,
  isOwner,
} from "../middlewares/authMiddleware";

const router = Router();

router.use(isAuthenticated);

router.get("/all", isAdmin, getAllUsers);
router.get("/:userId", isOwner, getUserById);
router.put("/:userId", isOwner, updateUserById);

export default router;
