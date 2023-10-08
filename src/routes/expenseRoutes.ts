import express from "express";
import {
  createExpense,
  deleteExpense,
  getAllExpensesByHouse,
  getAllExpensesByUser,
  getAllExpensesByUserInHouse,
  getExpenseById,
  updateExpense,
} from "../controllers/expenseControllers";
import {
  checkExpenseOwnership,
  checkExpensesOwnership,
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

// Get all expensens by user Id and house code
router.get("/user/:id/:houseCode", getAllExpensesByUserInHouse);

// Get all expenses by house code
router.get("/house/:houseCode", getAllExpensesByHouse);

// Update an expense by ID
router.put("/edit/:id", checkExpenseOwnership, updateExpense);

// Delete an expense by ID
router.delete("/:id", checkExpenseOwnership, deleteExpense);

export default router;
