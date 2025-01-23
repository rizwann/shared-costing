import { Router } from "express";
import { getPlayerStatById, getPlayerStats, scrapeMembers } from "../controllers/playerController";

const router = Router()


router.post("/create", scrapeMembers);

router.get("/", getPlayerStats);
router.get("/:id", getPlayerStatById);

export default router;
