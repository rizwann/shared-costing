import express from "express";

import {
  calculateHouseExpensesAndDebts,
  createExpense,
  deleteExpense,
  getAllExpensesByHouse,
  getAllExpensesByUser,
  getAllExpensesByUserInHouse,
  getExpenseById,
  getExpensesOfCurrentMonthByUserInHouse,
  getExpensesOfCurrentWeekByUserInHouse,
  getExpensesOfCurrentYearByUserInHouse,
  getExpensesOfHouseByCurrentMonth,
  getExpensesOfSpecificHouseByYear,
  getExpensesOfSpecificMonthAndYearByHouse,
  getExpensesOfSpecificMonthAndYearByUserInHouse,
  getExpensesOfSpecificYearByUserInHouse,
  updateExpense,
} from "../controllers/expenseControllers";
import {
  authMiddleware,
  checkExpenseOwnership,
  checkExpensesOwnershipAndHouseOwnership,
  checkHouseOwnership,
} from "../middlewares/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

// Create a new expense
router.post("/create", createExpense);

// Get all expenses
//router.get("/", getAllExpenses);

// Get a single expense by ID
router.get("/:expenseId", checkExpenseOwnership, getExpenseById);

// Get all expenses by user ID
router.get("/user/:userId", getAllExpensesByUser);

// Update an expense by ID
router.put("/:expenseId", checkExpenseOwnership, updateExpense);

// Delete an expense by ID
router.delete("/:expenseId", checkExpenseOwnership, deleteExpense);

// all routes for expenses reporting

// Get all expensens by user Id and house code
router.get(
  "/user/:userId/:houseCode/all",
  checkExpensesOwnershipAndHouseOwnership,
  getAllExpensesByUserInHouse
);

// Get all expenses by house code
router.get("/house/:houseCode/all", checkHouseOwnership, getAllExpensesByHouse);

//get expense of current month by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentMonth",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentMonthByUserInHouse
);

//get expense of current week by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentWeek",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentWeekByUserInHouse
);

// get expense of current year by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentYear",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentYearByUserInHouse
);

// // get expense of a specific year by the user in a specific house
router.get(
  "/user/:userId/:houseCode/:year",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificYearByUserInHouse
);

// get expenses of a specific month and year by the user in a specific house

router.get(
  "/user/:userId/:houseCode/:year/:month",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificMonthAndYearByUserInHouse
);

// get all expenses of current month in a specific house

router.get(
  "/house/:houseCode/currentMonth",
  checkHouseOwnership,
  getExpensesOfHouseByCurrentMonth
);

// get expense of a specific year in a specific house

router.get(
  "/house/:houseCode/:year",
  checkHouseOwnership,
  getExpensesOfSpecificHouseByYear
);

// get expenses of a specific month and year  in a specific house

router.get(
  "/house/:houseCode/:year/:month",
  checkHouseOwnership,
  getExpensesOfSpecificMonthAndYearByHouse
);
router.get(
  "/balance/:houseCode",
  checkHouseOwnership,
  calculateHouseExpensesAndDebts
);

router.get(
  "/balance/:houseCode/:month/:year",
  checkHouseOwnership,
  calculateHouseExpensesAndDebts
);

export default router;
