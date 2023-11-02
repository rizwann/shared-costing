import express from "express";

import {
  getHouseExpensesByStores,
  getLast6MonthsExpensesByHouse,
  getUserWeeklyTotal,
} from "../controllers/chartDataController";
import {
  authMiddleware,
  checkHouseOwnership,
} from "../middlewares/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/stores/:houseCode", checkHouseOwnership, getHouseExpensesByStores);

router.get(
  "/user/expenses/weekly/:houseCode",
  checkHouseOwnership,
  getUserWeeklyTotal
);

router.get(
  "/user/expenses/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesByHouse
);

export default router;
