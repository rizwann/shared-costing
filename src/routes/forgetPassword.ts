import express from "express";
import {
  forgetPassword,
  resetPWPost,
  resetPassword,
} from "../controllers/authControllers";

const router = express.Router();

router.post("/forgot-password", forgetPassword);

router.get("/reset-password/:id/:token", resetPassword);

router.post("/reset-password/:id/:token", resetPWPost);

export default router;
