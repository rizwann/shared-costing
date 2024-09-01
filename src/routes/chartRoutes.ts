import express from "express";

import {
  getCurrentMonthExpenseComparison,
  getCurrentMonthExpensesByCategory,
  getCurrentMonthExpensesByHouseMembers,
  getCurrentMonthExpensesByStore,
  getHouseExpensesByStores,
  getLast6MonthsExpensesByCategory,
  getLast6MonthsExpensesByHouse,
  getLast6MonthsExpensesOfHouse,
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
  "/house/expenses/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesOfHouse
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

router.get(
  "/expenses/category/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByCategory
);

router.get(
  "/expenses/store/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByStore
);

router.get(
  "/expenses/category/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesByCategory
);

export default router;
