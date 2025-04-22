import { Router } from "express"
import {
  getPlayerStatById,
  getPlayerStats,
  scrapeMembers,
  getLastUpdated,
  scrapTeamDetails,
  getMatches,
} from "../controllers/playerController"
import { scrapTokenCheck } from "../middlewares/authMiddleware"

const router = Router()

router.post("/create", scrapTokenCheck, scrapeMembers)
router.post("/team", scrapTokenCheck, scrapTeamDetails)
router.get("/matches", getMatches)
router.get("/last-updated", scrapTokenCheck, getLastUpdated)
router.get("/", scrapTokenCheck, getPlayerStats)
router.get("/player/:id", scrapTokenCheck, getPlayerStatById)

export default router
