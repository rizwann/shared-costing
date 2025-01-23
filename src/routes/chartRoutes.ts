import express from "express";

import {
  getCurrentMonthExpenseComparison,
  getCurrentMonthExpensesByCategory,
  getCurrentMonthExpensesByHouseMembers,
  getCurrentMonthExpensesByStore,
  getHouseExpensesByStores,
  getLast6MonthsExpensesByCategory,
  getLast6MonthsExpensesByHouse,
  getLast6MonthsExpensesByHouseStoreName,
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
  "/user/expenses/half-yearly/:houseCode/:month/:year",
  checkHouseOwnership,
  getLast6MonthsExpensesByHouse
);

router.get(
  "/house/expenses/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesOfHouse
);
router.get(
  "/house/expenses/half-yearly/:houseCode/:month/:year",
  checkHouseOwnership,
  getLast6MonthsExpensesOfHouse
);
router.get(
  "/house/expenses/contributions/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByHouseMembers
);

router.get(
  "/house/expenses/contributions/:houseCode/:month/:year",
  checkHouseOwnership,
  getCurrentMonthExpensesByHouseMembers
);

router.get(
  "/user/expenses/comparison/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpenseComparison
);

router.get(
  "/user/expenses/comparison/:houseCode/:month/:year",
  checkHouseOwnership,
  getCurrentMonthExpenseComparison
);

router.get(
  "/expenses/category/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByCategory
);

router.get(
  "/expenses/category/:houseCode/:month/:year",
  checkHouseOwnership,
  getCurrentMonthExpensesByCategory
);

router.get(
  "/expenses/store/:houseCode",
  checkHouseOwnership,
  getCurrentMonthExpensesByStore
);
router.get(
  "/expenses/store/:houseCode/:month/:year",
  checkHouseOwnership,
  getCurrentMonthExpensesByStore
);

router.get(
  "/expenses/category/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesByCategory
);

router.get(
  "/expenses/category/half-yearly/:houseCode/:month/:year",
  checkHouseOwnership,
  getLast6MonthsExpensesByCategory
);

router.get(
  "/expenses/store/half-yearly/:houseCode",
  checkHouseOwnership,
  getLast6MonthsExpensesByHouseStoreName
);

router.get(
  "/expenses/store/half-yearly/:houseCode/:month/:year",
  checkHouseOwnership,
  getLast6MonthsExpensesByHouseStoreName
);

export default router;
