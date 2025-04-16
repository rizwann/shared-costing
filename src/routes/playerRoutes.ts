import { Router } from "express"
import {
  getPlayerStatById,
  getPlayerStats,
  scrapeMembers,
  getLastUpdated,
} from "../controllers/playerController"
import { scrapTokenCheck } from "../middlewares/authMiddleware"

const router = Router()

router.post("/create", scrapTokenCheck, scrapeMembers)
router.get("/last-updated", scrapTokenCheck, getLastUpdated)
router.get("/", scrapTokenCheck, getPlayerStats)
router.get("/player/:id", scrapTokenCheck, getPlayerStatById)

export default router
