import express from "express";

import {
  getCurrentMonthExpenseComparison,
  getCurrentMonthExpensesByHouseMembers,
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

router.get(
  "/house/expenses/contributions/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByHouseMembers
);
router.get(
  "/user/expenses/comparison/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpenseComparison
);

export default router;
