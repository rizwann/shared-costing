import { Router } from "express";
import { getPlayerStatById, getPlayerStats, scrapeMembers, getLastUpdated } from "../controllers/playerController";

const router = Router()


router.post("/create", scrapeMembers);
router.get("/last-updated", getLastUpdated);
router.get("/", getPlayerStats);
router.get("/player/:id", getPlayerStatById);

export default router;
