import express from "express";
import {
  createExpense,
  deleteExpense,
  getAllExpensesByHouse,
  getAllExpensesByUser,
  getAllExpensesByUserInHouse,
  getExpenseById,
  getExpensesOfCurrentMonthByHouse,
  getExpensesOfCurrentMonthByUserInHouse,
  getExpensesOfCurrentYearByUserInHouse,
  getExpensesOfSpecificHouseByYear,
  getExpensesOfSpecificMonthAndYearByHouse,
  getExpensesOfSpecificMonthAndYearByUserInHouse,
  getExpensesOfSpecificYearByUserInHouse,
  updateExpense,
} from "../controllers/expenseControllers";
import {
  checkExpenseOwnership,
  checkExpensesOwnership,
  checkExpensesOwnershipAndHouseOwnership,
  checkHouseOwnership,
  isAuthenticated,
} from "../middlewares/authMiddleware";

const router = express.Router();

router.use(isAuthenticated);

// Create a new expense
router.post("/create", createExpense);

// Get all expenses
//router.get("/", getAllExpenses);

// Get a single expense by ID
router.get("/:id", checkExpenseOwnership, getExpenseById);

// Get all expenses by user ID
router.get("/user/:id", checkExpensesOwnership, getAllExpensesByUser);

// Update an expense by ID
router.put("/edit/:id", checkExpenseOwnership, updateExpense);

// Delete an expense by ID
router.delete("/:id", checkExpenseOwnership, deleteExpense);

// all routes for expenses reporting

// Get all expensens by user Id and house code
router.get(
  "/user/:id/:houseCode/all",
  checkExpensesOwnershipAndHouseOwnership,
  getAllExpensesByUserInHouse
);

// Get all expenses by house code
router.get("/house/:houseCode/all", checkHouseOwnership, getAllExpensesByHouse);

//get expense of current month by the user in a specific house

router.get(
  "/user/:id/:houseCode/currentMonth",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentMonthByUserInHouse
);

// get expense of current year by the user in a specific house

router.get(
  "/user/:id/:houseCode/currentYear",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentYearByUserInHouse
);

// // get expense of a specific year by the user in a specific house
router.get(
  "/user/:id/:houseCode/:year",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificYearByUserInHouse
);

// get expenses of a specific month and year by the user in a specific house

router.get(
  "/user/:id/:houseCode/:year/:month",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificMonthAndYearByUserInHouse
);

// get all expenses of current month in a specific house

router.get(
  "/house/:houseCode/currentMonth",
  checkHouseOwnership,
  getExpensesOfCurrentMonthByHouse
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

export default router;
